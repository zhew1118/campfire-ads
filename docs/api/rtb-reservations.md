# RTB Slot Reservation API

This API provides the slot reservation system that enables RTB (Real-Time Bidding) functionality. The flow allows advertisers to place soft-holds on ad slots during the bidding process.

## Flow Overview

```
1. Advertiser bids → POST /reservations/reserve (60-second soft hold)
2. RTB engine evaluates → GET /reservations/slots/:id (see all bids)
3. Winner determined → POST /reservations/:id/confirm (permanent booking)
4. Losers released → DELETE /reservations/:id/release (or auto-expire)
```

## Database Schema

```sql
CREATE TABLE slot_reservations (
    id UUID PRIMARY KEY,
    ad_slot_id UUID NOT NULL REFERENCES ad_slots(id),
    campaign_id UUID NOT NULL REFERENCES campaigns(id),
    advertiser_id UUID NOT NULL REFERENCES users(id),
    bid_cpm BIGINT NOT NULL, -- stored in micros (1000000 = $1.00 CPM)
    status VARCHAR(20) CHECK (status IN ('reserved','confirmed','expired','released')),
    expires_at TIMESTAMPTZ NOT NULL, -- typically 60 seconds from creation
    reserved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMPTZ
);

-- Only one confirmed reservation per slot
CREATE UNIQUE INDEX unique_confirmed_reservation
ON slot_reservations(ad_slot_id) WHERE status = 'confirmed';
```

## API Endpoints

### 1. Reserve Slot (Advertiser Bidding)

**POST** `/api/reservations/reserve`

Places a 60-second soft hold on an ad slot for bidding.

**Auth:** JWT Required (advertiser role)

**Request Body:**
```json
{
  "ad_slot_id": "uuid",
  "campaign_id": "uuid", 
  "bid_cpm_micros": 1250000  // $1.25 CPM in micros
}
```

**Response 201:**
```json
{
  "status": "success",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "reservation": {
      "id": "uuid",
      "ad_slot_id": "uuid",
      "campaign_id": "uuid",
      "advertiser_id": "uuid",
      "bid_cpm": 1250000,
      "status": "reserved",
      "expires_at": "2024-01-01T12:01:00Z",
      "reserved_at": "2024-01-01T12:00:00Z"
    },
    "expires_in_seconds": 60,
    "message": "Slot reserved for 60 seconds"
  }
}
```

**Errors:**
- `409` - Slot already confirmed by another advertiser
- `404` - Ad slot not found
- `409` - Ad slot not available

### 2. Get Slot Reservations (RTB Engine + Slot Owner)

**GET** `/api/reservations/slots/:slot_id`

Gets all active reservations (bids) for a slot. Used by RTB engine to evaluate bids, or by podcaster to see bids on their slots.

**Auth:** JWT Required (admin role OR slot owner - podcaster who owns the episode/podcast)

**Response 200:**
```json
{
  "status": "success",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "slot_id": "uuid",
    "reservations": [
      {
        "id": "uuid",
        "ad_slot_id": "uuid",
        "campaign_id": "uuid",
        "advertiser_id": "uuid",
        "bid_cmp": 1250000,
        "status": "reserved",
        "expires_at": "2024-01-01T12:01:00Z",
        "reserved_at": "2024-01-01T12:00:00Z",
        "campaign_name": "Q4 Campaign",
        "advertiser_email": "advertiser@example.com"
      }
    ],
    "bid_count": 1
  }
}
```

### 3. Confirm Reservation (Winning Bid)

**POST** `/api/reservations/:reservation_id/confirm`

Confirms a reservation, converting it to a permanent booking. Used when RTB engine determines the winner.

**Auth:** JWT Required (advertiser or admin role)

**Response 200:**
```json
{
  "status": "success",
  "timestamp": "2024-01-01T12:00:30Z",
  "data": {
    "reservation": {
      "id": "uuid",
      "ad_slot_id": "uuid",
      "campaign_id": "uuid",
      "advertiser_id": "uuid",
      "bid_cpm": 1250000,
      "status": "confirmed",
      "expires_at": "2024-01-01T12:01:00Z",
      "reserved_at": "2024-01-01T12:00:00Z",
      "confirmed_at": "2024-01-01T12:00:30Z"
    },
    "message": "Reservation confirmed - slot is now booked"
  }
}
```

**Errors:**
- `404` - Reservation not found or expired

### 4. Release Reservation (Losing Bid)

**POST** `/api/reservations/:reservation_id/release`

Releases a reservation by setting status to 'released'. Used for losing bids or when advertiser wants to cancel. Records are kept for analytics.

**Auth:** JWT Required (advertiser or admin role)

**Response 200:**
```json
{
  "status": "success",
  "timestamp": "2024-01-01T12:00:45Z",
  "data": {
    "reservation_id": "uuid",
    "previous_status": "reserved",
    "new_status": "released",
    "message": "Reservation released successfully"
  }
}
```

**Errors:**
- `404` - Reservation not found or already processed

### 5. Get Available Slots

**GET** `/api/reservations/available`

Gets slots that are available for bidding (no confirmed reservations). **Always paginated for scalability.**

**Auth:** None required (public for RTB discovery)

**Query Parameters:**
- `category` - Podcast category filter
- `position` - pre_roll, mid_roll, post_roll
- `min_cpm` - Minimum CPM floor price (required for large datasets)
- `max_cpm` - Maximum CPM floor price  
- `duration` - Ad duration in seconds
- `page` - Page number (default: 1, required)
- `limit` - Items per page (default: 20, max: 100)

**Response 200:**
```json
{
  "status": "success",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "available_slots": [
      {
        "id": "uuid",
        "episode_id": "uuid",
        "position": "pre_roll",
        "duration": 30,
        "cpm_floor": 200,
        "available": true,
        "episode_title": "Tech Talk Episode 1",
        "episode_duration": 1800,
        "podcast_name": "Tech Talk Daily",
        "podcast_category": "Technology"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    },
    "filters": {
      "category": "Technology",
      "position": "pre_roll"
    }
  }
}
```

### 6. Get Campaign Reservations

**GET** `/api/reservations/campaigns/:campaign_id`

Gets all reservations for a specific campaign.

**Auth:** JWT Required (advertiser or admin role)

**Response 200:**
```json
{
  "status": "success",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "campaign_id": "uuid",
    "reservations": [
      {
        "id": "uuid",
        "ad_slot_id": "uuid",
        "bid_cpm": 1250000,
        "status": "confirmed",
        "reserved_at": "2024-01-01T11:30:00Z",
        "confirmed_at": "2024-01-01T11:30:30Z",
        "position": "pre_roll",
        "duration": 30,
        "episode_title": "Tech Talk Episode 1",
        "podcast_name": "Tech Talk Daily"
      }
    ],
    "total": 1
  }
}
```

### 7. Reservation Statistics (Admin)

**GET** `/api/reservations/stats`

Gets system-wide reservation statistics.

**Auth:** JWT Required (admin role only)

**Response 200:**
```json
{
  "status": "success",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "totalActive": 15,      // currently reserved (not expired)
    "totalConfirmed": 142,  // permanently booked
    "totalExpired": 89,     // expired without confirmation
    "averageBidCpm": 987500 // average bid in micros ($0.98)
  }
}
```

### 8. Manual Cleanup (Admin)

**POST** `/api/reservations/cleanup`

Manually expires old reservations. Normally handled automatically.

**Auth:** JWT Required (admin role only)

**Response 200:**
```json
{
  "status": "success", 
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "expired_count": 5,
    "message": "Expired 5 old reservations"
  }
}
```

## Integration Points

### API Gateway Routes
These endpoints should be added to the API Gateway:

```javascript
// In api-gateway/src/routes/reservations.ts
app.use('/api/reservations', authMiddleware.validateJWT, reservationRoutes);
```

### RTB Engine Integration
The RTB engine would use these endpoints in this sequence:

1. **Discovery:** `GET /api/reservations/available` to find biddable slots
2. **Auction:** Multiple advertisers `POST /api/reservations/reserve` 
3. **Evaluation:** `GET /api/reservations/slots/:id` to see all bids
4. **Winner Selection:** `POST /api/reservations/:winner_id/confirm`
5. **Cleanup:** `POST /api/reservations/:loser_id/release` for losing bids

### Data Retention & Privacy

**No Hard Deletes:** All reservations remain in the database permanently for analytics and auditing:
- `reserved` → `confirmed` (winning bids)
- `reserved` → `released` (losing bids or cancellations) 
- `reserved` → `expired` (automatic timeout after 60 seconds)

**Access Control:**
- **Advertisers:** Can only see their own reservations
- **Podcasters:** Can see all bids on slots they own
- **RTB Engine/Admin:** Can see all bids system-wide
- **Public:** Can browse available slots (no bid details)

### Concurrency Control
- The unique index prevents double-booking of slots
- 60-second expiration prevents stale reservations
- Status transitions are atomic: reserved → confirmed/expired/released

## Error Handling

All endpoints return consistent error format:
```json
{
  "status": "error",
  "timestamp": "2024-01-01T12:00:00Z", 
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

Common error codes:
- `NOT_AUTHENTICATED` - Missing or invalid JWT
- `INSUFFICIENT_PERMISSIONS` - Wrong user role
- `SLOT_ALREADY_CONFIRMED` - Slot unavailable
- `BID_TOO_LOW` - Bid below slot's minimum CPM floor
- `RESERVATION_NOT_FOUND` - Invalid reservation ID
- `RESERVATION_EXPIRED` - Reservation expired