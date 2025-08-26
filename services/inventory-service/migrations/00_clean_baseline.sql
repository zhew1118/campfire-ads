--
-- PostgreSQL database dump
--

\restrict ymLSfK7u3E5kG3Cqkq5ehxDMatGCW7ixT5FiYdJJY1xeyxTWggqd6VLXdWKklsR

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.slot_reservations DROP CONSTRAINT IF EXISTS slot_reservations_campaign_id_fkey;
ALTER TABLE IF EXISTS ONLY public.slot_reservations DROP CONSTRAINT IF EXISTS slot_reservations_advertiser_id_fkey;
ALTER TABLE IF EXISTS ONLY public.slot_reservations DROP CONSTRAINT IF EXISTS slot_reservations_ad_slot_id_fkey;
ALTER TABLE IF EXISTS ONLY public.podcasts DROP CONSTRAINT IF EXISTS podcasts_podcaster_id_fkey;
ALTER TABLE IF EXISTS ONLY public.episodes DROP CONSTRAINT IF EXISTS episodes_podcast_id_fkey;
ALTER TABLE IF EXISTS ONLY public.creatives DROP CONSTRAINT IF EXISTS creatives_advertiser_id_fkey;
ALTER TABLE IF EXISTS ONLY public.campaigns DROP CONSTRAINT IF EXISTS campaigns_advertiser_id_fkey;
ALTER TABLE IF EXISTS ONLY public.campaign_creatives DROP CONSTRAINT IF EXISTS campaign_creatives_creative_id_fkey;
ALTER TABLE IF EXISTS ONLY public.campaign_creatives DROP CONSTRAINT IF EXISTS campaign_creatives_campaign_id_fkey;
ALTER TABLE IF EXISTS ONLY public.campaign_creatives DROP CONSTRAINT IF EXISTS campaign_creatives_assigned_by_fkey;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_campaign_id_fkey;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_ad_slot_id_fkey;
ALTER TABLE IF EXISTS ONLY public.ad_slots DROP CONSTRAINT IF EXISTS ad_slots_episode_id_fkey;
DROP INDEX IF EXISTS public.unique_confirmed_reservation;
DROP INDEX IF EXISTS public.idx_slot_reservations_status;
DROP INDEX IF EXISTS public.idx_slot_reservations_expires_at;
DROP INDEX IF EXISTS public.idx_slot_reservations_campaign_id;
DROP INDEX IF EXISTS public.idx_slot_reservations_advertiser_id;
DROP INDEX IF EXISTS public.idx_slot_reservations_ad_slot_id;
DROP INDEX IF EXISTS public.idx_podcasts_podcaster_id;
DROP INDEX IF EXISTS public.idx_podcasts_category;
DROP INDEX IF EXISTS public.idx_episodes_published_at;
DROP INDEX IF EXISTS public.idx_episodes_podcast_id;
DROP INDEX IF EXISTS public.idx_creatives_is_approved;
DROP INDEX IF EXISTS public.idx_creatives_creative_type;
DROP INDEX IF EXISTS public.idx_creatives_advertiser_id;
DROP INDEX IF EXISTS public.idx_campaigns_status;
DROP INDEX IF EXISTS public.idx_campaigns_advertiser_id;
DROP INDEX IF EXISTS public.idx_campaign_creatives_creative_id;
DROP INDEX IF EXISTS public.idx_campaign_creatives_campaign_id;
DROP INDEX IF EXISTS public.idx_bookings_campaign_id;
DROP INDEX IF EXISTS public.idx_bookings_ad_slot_id;
DROP INDEX IF EXISTS public.idx_ad_slots_episode_id;
DROP INDEX IF EXISTS public.idx_ad_slots_available;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.slot_reservations DROP CONSTRAINT IF EXISTS slot_reservations_pkey;
ALTER TABLE IF EXISTS ONLY public.podcasts DROP CONSTRAINT IF EXISTS podcasts_pkey;
ALTER TABLE IF EXISTS ONLY public.episodes DROP CONSTRAINT IF EXISTS episodes_pkey;
ALTER TABLE IF EXISTS ONLY public.creatives DROP CONSTRAINT IF EXISTS creatives_pkey;
ALTER TABLE IF EXISTS ONLY public.campaigns DROP CONSTRAINT IF EXISTS campaigns_pkey;
ALTER TABLE IF EXISTS ONLY public.campaign_creatives DROP CONSTRAINT IF EXISTS campaign_creatives_pkey;
ALTER TABLE IF EXISTS ONLY public.campaign_creatives DROP CONSTRAINT IF EXISTS campaign_creatives_campaign_id_creative_id_key;
ALTER TABLE IF EXISTS ONLY public.bookings DROP CONSTRAINT IF EXISTS bookings_pkey;
ALTER TABLE IF EXISTS ONLY public.ad_slots DROP CONSTRAINT IF EXISTS ad_slots_pkey;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.slot_reservations;
DROP TABLE IF EXISTS public.podcasts;
DROP TABLE IF EXISTS public.episodes;
DROP TABLE IF EXISTS public.creatives;
DROP TABLE IF EXISTS public.campaigns;
DROP TABLE IF EXISTS public.campaign_creatives;
DROP TABLE IF EXISTS public.bookings;
DROP TABLE IF EXISTS public.ad_slots;
DROP EXTENSION IF EXISTS "uuid-ossp";
--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ad_slots; Type: TABLE; Schema: public; Owner: campfire_user
--

CREATE TABLE public.ad_slots (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    episode_id uuid NOT NULL,
    "position" character varying(50) NOT NULL,
    duration integer NOT NULL,
    cpm_floor numeric(8,2) DEFAULT 0 NOT NULL,
    available boolean DEFAULT true,
    start_time integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ad_slots_position_check CHECK ((("position")::text = ANY ((ARRAY['pre_roll'::character varying, 'mid_roll'::character varying, 'post_roll'::character varying])::text[])))
);


ALTER TABLE public.ad_slots OWNER TO campfire_user;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: campfire_user
--

CREATE TABLE public.bookings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    campaign_id uuid NOT NULL,
    ad_slot_id uuid NOT NULL,
    cpm_price numeric(10,2) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    booked_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    delivered_at timestamp with time zone,
    CONSTRAINT bookings_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'delivered'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.bookings OWNER TO campfire_user;

--
-- Name: campaign_creatives; Type: TABLE; Schema: public; Owner: campfire_user
--

CREATE TABLE public.campaign_creatives (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    campaign_id uuid NOT NULL,
    creative_id uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    assigned_by uuid
);


ALTER TABLE public.campaign_creatives OWNER TO campfire_user;

--
-- Name: campaigns; Type: TABLE; Schema: public; Owner: campfire_user
--

CREATE TABLE public.campaigns (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    advertiser_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    budget numeric(12,2) NOT NULL,
    spent numeric(12,2) DEFAULT 0,
    target_categories text[],
    max_cpm numeric(8,2) NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status character varying(50) DEFAULT 'draft'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT campaigns_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'active'::character varying, 'paused'::character varying, 'completed'::character varying])::text[])))
);


ALTER TABLE public.campaigns OWNER TO campfire_user;

--
-- Name: creatives; Type: TABLE; Schema: public; Owner: campfire_user
--

CREATE TABLE public.creatives (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    advertiser_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    file_name character varying(255) NOT NULL,
    file_size bigint NOT NULL,
    mime_type character varying(100) NOT NULL,
    creative_type character varying(50) NOT NULL,
    width integer,
    height integer,
    duration integer,
    is_approved boolean DEFAULT false,
    rejection_reason text,
    checksum character varying(64),
    upload_ip inet,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT creatives_creative_type_check CHECK (((creative_type)::text = ANY ((ARRAY['image'::character varying, 'audio'::character varying, 'video'::character varying])::text[])))
);


ALTER TABLE public.creatives OWNER TO campfire_user;

--
-- Name: episodes; Type: TABLE; Schema: public; Owner: campfire_user
--

CREATE TABLE public.episodes (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    podcast_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    duration integer NOT NULL,
    audio_url character varying(500) NOT NULL,
    file_size bigint,
    episode_number integer,
    season_number integer,
    published_at timestamp with time zone,
    status character varying(50) DEFAULT 'draft'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT episodes_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying])::text[])))
);


ALTER TABLE public.episodes OWNER TO campfire_user;

--
-- Name: podcasts; Type: TABLE; Schema: public; Owner: campfire_user
--

CREATE TABLE public.podcasts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    podcaster_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    category character varying(100) NOT NULL,
    rss_url character varying(500),
    artwork_url character varying(500),
    language character varying(10) DEFAULT 'en'::character varying,
    explicit boolean DEFAULT false,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT podcasts_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'pending'::character varying])::text[])))
);


ALTER TABLE public.podcasts OWNER TO campfire_user;

--
-- Name: slot_reservations; Type: TABLE; Schema: public; Owner: campfire_user
--

CREATE TABLE public.slot_reservations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    ad_slot_id uuid NOT NULL,
    campaign_id uuid NOT NULL,
    advertiser_id uuid NOT NULL,
    bid_cpm bigint NOT NULL,
    status character varying(20) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    reserved_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    confirmed_at timestamp with time zone,
    CONSTRAINT slot_reservations_status_check CHECK (((status)::text = ANY ((ARRAY['reserved'::character varying, 'confirmed'::character varying, 'expired'::character varying, 'released'::character varying])::text[])))
);


ALTER TABLE public.slot_reservations OWNER TO campfire_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: campfire_user
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    first_name character varying(100),
    last_name character varying(100),
    company_name character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['podcaster'::character varying, 'advertiser'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO campfire_user;

--
-- Data for Name: ad_slots; Type: TABLE DATA; Schema: public; Owner: campfire_user
--

COPY public.ad_slots (id, episode_id, "position", duration, cpm_floor, available, start_time, created_at, updated_at) FROM stdin;
880e8400-e29b-41d4-a716-446655440000	770e8400-e29b-41d4-a716-446655440000	pre_roll	30	250.00	t	\N	2025-08-26 02:08:12.155096+00	2025-08-26 02:08:12.155096+00
880e8400-e29b-41d4-a716-446655440001	770e8400-e29b-41d4-a716-446655440000	mid_roll	60	300.00	t	\N	2025-08-26 02:08:12.155096+00	2025-08-26 02:08:12.155096+00
880e8400-e29b-41d4-a716-446655440002	770e8400-e29b-41d4-a716-446655440001	pre_roll	30	200.00	t	\N	2025-08-26 02:08:12.155096+00	2025-08-26 02:08:12.155096+00
880e8400-e29b-41d4-a716-446655440003	770e8400-e29b-41d4-a716-446655440002	pre_roll	30	400.00	t	\N	2025-08-26 02:08:12.155096+00	2025-08-26 02:08:12.155096+00
880e8400-e29b-41d4-a716-446655440004	770e8400-e29b-41d4-a716-446655440002	mid_roll	45	450.00	t	\N	2025-08-26 02:08:12.155096+00	2025-08-26 02:08:12.155096+00
880e8400-e29b-41d4-a716-446655440005	770e8400-e29b-41d4-a716-446655440003	pre_roll	30	350.00	t	\N	2025-08-26 02:08:12.155096+00	2025-08-26 02:08:12.155096+00
880e8400-e29b-41d4-a716-446655440006	770e8400-e29b-41d4-a716-446655440003	post_roll	15	300.00	t	\N	2025-08-26 02:08:12.155096+00	2025-08-26 02:08:12.155096+00
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: campfire_user
--

COPY public.bookings (id, campaign_id, ad_slot_id, cpm_price, status, booked_at, delivered_at) FROM stdin;
\.


--
-- Data for Name: campaign_creatives; Type: TABLE DATA; Schema: public; Owner: campfire_user
--

COPY public.campaign_creatives (id, campaign_id, creative_id, assigned_at, assigned_by) FROM stdin;
1ae2d371-a27e-4bcd-a0bc-88b8244a5358	990e8400-e29b-41d4-a716-446655440000	cc0e8400-e29b-41d4-a716-446655440000	2025-08-26 02:11:27.174521+00	550e8400-e29b-41d4-a716-446655440001
10f7fce4-f8fb-4dc3-9b7a-7437a192abfb	990e8400-e29b-41d4-a716-446655440000	cc0e8400-e29b-41d4-a716-446655440001	2025-08-26 02:11:27.174521+00	550e8400-e29b-41d4-a716-446655440001
e5e79004-2ea4-4022-8f89-9a099c809778	990e8400-e29b-41d4-a716-446655440001	cc0e8400-e29b-41d4-a716-446655440002	2025-08-26 02:11:27.174521+00	550e8400-e29b-41d4-a716-446655440001
9167a377-2769-4de1-803a-04163ce7e21c	990e8400-e29b-41d4-a716-446655440001	cc0e8400-e29b-41d4-a716-446655440003	2025-08-26 02:11:27.174521+00	550e8400-e29b-41d4-a716-446655440003
c93d4acf-ec99-49e9-bd01-8f760f06e3d6	990e8400-e29b-41d4-a716-446655440001	cc0e8400-e29b-41d4-a716-446655440004	2025-08-26 02:11:27.174521+00	550e8400-e29b-41d4-a716-446655440003
\.


--
-- Data for Name: campaigns; Type: TABLE DATA; Schema: public; Owner: campfire_user
--

COPY public.campaigns (id, advertiser_id, name, description, budget, spent, target_categories, max_cpm, start_date, end_date, status, created_at, updated_at) FROM stdin;
990e8400-e29b-41d4-a716-446655440000	550e8400-e29b-41d4-a716-446655440001	Q4 Tech Product Launch	Promoting our latest tech product	5000000.00	0.00	{Technology,Business}	350.00	2024-10-01	2024-12-31	active	2025-08-26 02:08:12.157023+00	2025-08-26 02:08:12.157023+00
990e8400-e29b-41d4-a716-446655440001	550e8400-e29b-41d4-a716-446655440003	Creative Brand Awareness	Building brand awareness through creative content	3000000.00	0.00	{Arts,Lifestyle}	500.00	2024-11-01	2024-12-31	active	2025-08-26 02:08:12.157023+00	2025-08-26 02:08:12.157023+00
\.


--
-- Data for Name: creatives; Type: TABLE DATA; Schema: public; Owner: campfire_user
--

COPY public.creatives (id, advertiser_id, name, file_path, file_name, file_size, mime_type, creative_type, width, height, duration, is_approved, rejection_reason, checksum, upload_ip, created_at, updated_at) FROM stdin;
cc0e8400-e29b-41d4-a716-446655440000	550e8400-e29b-41d4-a716-446655440001	Tech Product Hero Banner	/uploads/creatives/tech-hero-banner.jpg	tech-hero-banner.jpg	245760	image/jpeg	image	1200	628	\N	t	\N	\N	\N	2025-08-26 02:11:15.143076+00	2025-08-26 02:11:15.143076+00
cc0e8400-e29b-41d4-a716-446655440001	550e8400-e29b-41d4-a716-446655440001	30-Second Tech Audio Ad	/uploads/creatives/tech-audio-ad-30s.mp3	tech-audio-ad-30s.mp3	480000	audio/mpeg	audio	\N	\N	30	t	\N	\N	\N	2025-08-26 02:11:15.143076+00	2025-08-26 02:11:15.143076+00
cc0e8400-e29b-41d4-a716-446655440002	550e8400-e29b-41d4-a716-446655440001	Brand Logo Square	/uploads/creatives/brand-logo-square.png	brand-logo-square.png	125440	image/png	image	512	512	\N	t	\N	\N	\N	2025-08-26 02:11:15.143076+00	2025-08-26 02:11:15.143076+00
cc0e8400-e29b-41d4-a716-446655440003	550e8400-e29b-41d4-a716-446655440003	60-Second Brand Story	/uploads/creatives/brand-story-60s.mp3	brand-story-60s.mp3	960000	audio/mpeg	audio	\N	\N	60	f	\N	\N	\N	2025-08-26 02:11:15.143076+00	2025-08-26 02:11:15.143076+00
cc0e8400-e29b-41d4-a716-446655440004	550e8400-e29b-41d4-a716-446655440003	Holiday Promo Audio	/uploads/creatives/holiday-promo.mp3	holiday-promo.mp3	720000	audio/mpeg	audio	\N	\N	45	t	\N	\N	\N	2025-08-26 02:11:15.143076+00	2025-08-26 02:11:15.143076+00
\.


--
-- Data for Name: episodes; Type: TABLE DATA; Schema: public; Owner: campfire_user
--

COPY public.episodes (id, podcast_id, title, description, duration, audio_url, file_size, episode_number, season_number, published_at, status, created_at, updated_at) FROM stdin;
770e8400-e29b-41d4-a716-446655440000	660e8400-e29b-41d4-a716-446655440000	The Future of AI	Exploring artificial intelligence trends	1800	https://example.com/audio/ai-episode.mp3	\N	\N	\N	\N	published	2025-08-26 02:08:12.153223+00	2025-08-26 02:08:12.153223+00
770e8400-e29b-41d4-a716-446655440001	660e8400-e29b-41d4-a716-446655440001	Weekend Plans	Discussing weekend activities	1200	https://example.com/audio/weekend-episode.mp3	\N	\N	\N	\N	published	2025-08-26 02:08:12.153223+00	2025-08-26 02:08:12.153223+00
770e8400-e29b-41d4-a716-446655440002	660e8400-e29b-41d4-a716-446655440002	Startup Success Stories	Interviews with successful entrepreneurs	2400	https://example.com/audio/startup-episode.mp3	\N	\N	\N	\N	published	2025-08-26 02:08:12.153223+00	2025-08-26 02:08:12.153223+00
770e8400-e29b-41d4-a716-446655440003	660e8400-e29b-41d4-a716-446655440003	Designer Spotlight	Featuring emerging design talents	1600	https://example.com/audio/design-episode.mp3	\N	\N	\N	\N	published	2025-08-26 02:08:12.153223+00	2025-08-26 02:08:12.153223+00
\.


--
-- Data for Name: podcasts; Type: TABLE DATA; Schema: public; Owner: campfire_user
--

COPY public.podcasts (id, podcaster_id, name, description, category, rss_url, artwork_url, language, explicit, status, created_at, updated_at) FROM stdin;
660e8400-e29b-41d4-a716-446655440000	550e8400-e29b-41d4-a716-446655440000	Tech Talk Daily	Daily discussions about the latest in technology	Technology	\N	\N	en	f	active	2025-08-26 02:08:12.151286+00	2025-08-26 02:08:12.151286+00
660e8400-e29b-41d4-a716-446655440001	550e8400-e29b-41d4-a716-446655440000	Morning Coffee Chat	Casual morning conversations	Lifestyle	\N	\N	en	f	active	2025-08-26 02:08:12.151286+00	2025-08-26 02:08:12.151286+00
660e8400-e29b-41d4-a716-446655440002	550e8400-e29b-41d4-a716-446655440002	Business Mindset Weekly	Weekly insights on entrepreneurship and business strategy	Business	\N	\N	en	f	active	2025-08-26 02:08:12.151286+00	2025-08-26 02:08:12.151286+00
660e8400-e29b-41d4-a716-446655440003	550e8400-e29b-41d4-a716-446655440002	Creative Chronicles	Conversations with artists, designers, and creators	Arts	\N	\N	en	f	active	2025-08-26 02:08:12.151286+00	2025-08-26 02:08:12.151286+00
\.


--
-- Data for Name: slot_reservations; Type: TABLE DATA; Schema: public; Owner: campfire_user
--

COPY public.slot_reservations (id, ad_slot_id, campaign_id, advertiser_id, bid_cpm, status, expires_at, reserved_at, confirmed_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: campfire_user
--

COPY public.users (id, email, password_hash, role, first_name, last_name, company_name, created_at, updated_at) FROM stdin;
550e8400-e29b-41d4-a716-446655440000	test@example.com	$2b$10$eJ/aWQQyZe8F9kqFQqQvv.Q7KRKDQOjYqZJQJhYGZvVF7W8zRQvV.	podcaster	John	Doe	Podcast Studio	2025-08-26 02:08:12.149588+00	2025-08-26 02:08:12.149588+00
550e8400-e29b-41d4-a716-446655440001	advertiser@example.com	$2b$10$eJ/aWQQyZe8F9kqFQqQvv.Q7KRKDQOjYqZJQJhYGZvVF7W8zRQvV.	advertiser	Jane	Smith	TechCorp	2025-08-26 02:08:12.149588+00	2025-08-26 02:08:12.149588+00
550e8400-e29b-41d4-a716-446655440002	podcaster2@example.com	$2b$10$eJ/aWQQyZe8F9kqFQqQvv.Q7KRKDQOjYqZJQJhYGZvVF7W8zRQvV.	podcaster	Sarah	Williams	Creative Audio Lab	2025-08-26 02:08:12.149588+00	2025-08-26 02:08:12.149588+00
550e8400-e29b-41d4-a716-446655440003	advertiser2@example.com	$2b$10$eJ/aWQQyZe8F9kqFQqQvv.Q7KRKDQOjYqZJQJhYGZvVF7W8zRQvV.	advertiser	Mike	Johnson	AdTech Solutions	2025-08-26 02:08:12.149588+00	2025-08-26 02:08:12.149588+00
\.


--
-- Name: ad_slots ad_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: campfire_user
--

ALTER TABLE ONLY public.ad_slots
    ADD CONSTRAINT ad_slots_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: campfire_user
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: campaign_creatives campaign_creatives_campaign_id_creative_id_key; Type: CONSTRAINT; Schema: public; Owner: campfire_user
--

ALTER TABLE ONLY public.campaign_creatives
    ADD CONSTRAINT campaign_creatives_campaign_id_creative_id_key UNIQUE (campaign_id, creative_id);


--
-- Name: campaign_creatives campaign_creatives_pkey; Type: CONSTRAINT; Schema: public; Owner: campfire_user
--

ALTER TABLE ONLY public.campaign_creatives
    ADD CONSTRAINT campaign_creatives_pkey PRIMARY KEY (id);


--
-- Name: campaigns campaigns_pkey; Type: CONSTRAINT; Schema: public; Owner: campfire_user
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_pkey PRIMARY KEY (id);


--
-- Name: creatives creatives_pkey; Type: CONSTRAINT; Schema: public; Owner: campfire_user
--

ALTER TABLE ONLY public.creatives
    ADD CONSTRAINT creatives_pkey PRIMARY KEY (id);


--
-- Name: episodes episodes_pkey; Type: CONSTRAINT; Schema: public; Owner: campfire_user
--

ALTER TABLE ONLY public.episodes
    ADD CONSTRAINT episodes_pkey PRIMARY KEY (id);


--
-- Name: podcasts podcasts_pkey; Type: CONSTRAINT; Schema: public; Owner: campfire_user
--

ALTER TABLE ONLY public.podcasts
    ADD CONSTRAINT podcasts_pkey PRIMARY KEY (id);


--
-- Name: slot_reservations slot_reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: campfire_user
--

ALTER TABLE ONLY public.slot_reservations
    ADD CONSTRAINT slot_reservations_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: campfire_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: campfire_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_ad_slots_available; Type: INDEX; Schema: public; Owner: campfire_user
--

CREATE INDEX idx_ad_slots_available ON public.ad_slots USING btree (available);


--
-- Name: idx_ad_slots_episode_id; Type: INDEX; Schema: public; Owner: campfire_user
--

CREATE INDEX idx_ad_slots_episode_id ON public.ad_slots USING btree (episode_id);


--
-- Name: idx_bookings_ad_slot_id; Type: INDEX; Schema: public; Owner: campfire_user
--

CREATE INDEX idx_bookings_ad_slot_id ON public.bookings USING btree (ad_slot_id);


--
-- Name: idx_bookings_campaign_id; Type: INDEX; Schema: public; Owner: campfire_user
--

CREATE INDEX idx_bookings_campaign_id ON public.bookings USING btree (campaign_id);


--
-- Name: idx_campaign_creatives_campaign_id; Type: INDEX; Schema: public; Owner: campfire_user
--

CREATE INDEX idx_campaign_creatives_campaign_id ON public.campaign_creatives USING btree (campaign_id);


--
-- Name: idx_campaign_creatives_creative_id; Type: INDEX; Schema: public; Owner: campfire_user
--

CREATE INDEX idx_campaign_creatives_creative_id ON public.campaign_creatives USING btree (creative_id);


--
-- Name: idx_campaigns_advertiser_id; Type: INDEX; Schema: public; Owner: campfire_user
--

CREATE INDEX idx_campaigns_advertiser_id ON public.campaigns USING btree (advertiser_id);


--
-- Name: idx_campaigns_status; Type: INDEX; Schema: public; Owner: campfire_user
--

CREATE INDEX idx_campaigns_status ON public.campaigns USING btree (status);


--
-- Name: idx_creatives_advertiser_id; Type: INDEX; Schema: public; Owner: campfire_user
--

CREATE INDEX idx_creatives_advertiser_id ON public.creatives USING btree (advertiser_id);


--
-- Name: idx_creatives_creative_type; Type: INDEX; Schema: public; Owner: campfire_user
--

CREATE INDEX idx_creatives_creative_type ON public.creatives USING btree (creative_type);


--
-- Name: idx_creatives_is_approved; Type: INDEX; Schema: public; Owner: campfire_user
--

CREATE INDEX idx_creatives_is_approved ON public.creatives USING btree (is_approved);


--
-- Name: idx_episodes_podcast_id; Type: INDEX; Schema: public; Owner: campfire_user
--

CREATE INDEX idx_episodes_podcast_id ON public.episodes USING btree (podcast_id);


--
-- Name: idx_episodes_published_at; Type: INDEX; Schema: public; Owner: campfire_user
--

CREATE INDEX idx_episodes_published_at ON public.episodes USING btree (published_at);


--
-- Name: idx_podcasts_category; Type: INDEX; Schema: public; Owner: campfire_user
--

CREATE INDEX idx_podcasts_category ON public.podcasts USING btree (category);


--
-- Name: idx_podcasts_podcaster_id; Type: INDEX; Schema: public; Owner: campfire_user
--

CREATE INDEX idx_podcasts_podcaster_id ON public.podcasts USING btree (podcaster_id);


--
-- Name: idx_slot_reservations_ad_slot_id; Type: INDEX; Schema: public; Owner: campfire_user
--

CREATE INDEX idx_slot_reservations_ad_slot_id ON public.slot_reservations USING btree (ad_slot_id);


--
-- Name: idx_slot_reservations_advertiser_id; Type: INDEX; Schema: public; Owner: campfire_user
--

CREATE INDEX idx_slot_reservations_advertiser_id ON public.slot_reservations USING btree (advertiser_id);


--
-- Name: idx_slot_reservations_campaign_id; Type: INDEX; Schema: public; Owner: campfire_user
--

CREATE INDEX idx_slot_reservations_campaign_id ON public.slot_reservations USING btree (campaign_id);


--
-- Name: idx_slot_reservations_expires_at; Type: INDEX; Schema: public; Owner: campfire_user
--

CREATE INDEX idx_slot_reservations_expires_at ON public.slot_reservations USING btree (expires_at);


--
-- Name: idx_slot_reservations_status; Type: INDEX; Schema: public; Owner: campfire_user
--

CREATE INDEX idx_slot_reservations_status ON public.slot_reservations USING btree (status);


--
-- Name: unique_confirmed_reservation; Type: INDEX; Schema: public; Owner: campfire_user
--

CREATE UNIQUE INDEX unique_confirmed_reservation ON public.slot_reservations USING btree (ad_slot_id) WHERE ((status)::text = 'confirmed'::text);


--
-- Name: ad_slots ad_slots_episode_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: campfire_user
--

ALTER TABLE ONLY public.ad_slots
    ADD CONSTRAINT ad_slots_episode_id_fkey FOREIGN KEY (episode_id) REFERENCES public.episodes(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_ad_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: campfire_user
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_ad_slot_id_fkey FOREIGN KEY (ad_slot_id) REFERENCES public.ad_slots(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: campfire_user
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;


--
-- Name: campaign_creatives campaign_creatives_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: campfire_user
--

ALTER TABLE ONLY public.campaign_creatives
    ADD CONSTRAINT campaign_creatives_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- Name: campaign_creatives campaign_creatives_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: campfire_user
--

ALTER TABLE ONLY public.campaign_creatives
    ADD CONSTRAINT campaign_creatives_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;


--
-- Name: campaign_creatives campaign_creatives_creative_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: campfire_user
--

ALTER TABLE ONLY public.campaign_creatives
    ADD CONSTRAINT campaign_creatives_creative_id_fkey FOREIGN KEY (creative_id) REFERENCES public.creatives(id) ON DELETE CASCADE;


--
-- Name: campaigns campaigns_advertiser_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: campfire_user
--

ALTER TABLE ONLY public.campaigns
    ADD CONSTRAINT campaigns_advertiser_id_fkey FOREIGN KEY (advertiser_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: creatives creatives_advertiser_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: campfire_user
--

ALTER TABLE ONLY public.creatives
    ADD CONSTRAINT creatives_advertiser_id_fkey FOREIGN KEY (advertiser_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: episodes episodes_podcast_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: campfire_user
--

ALTER TABLE ONLY public.episodes
    ADD CONSTRAINT episodes_podcast_id_fkey FOREIGN KEY (podcast_id) REFERENCES public.podcasts(id) ON DELETE CASCADE;


--
-- Name: podcasts podcasts_podcaster_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: campfire_user
--

ALTER TABLE ONLY public.podcasts
    ADD CONSTRAINT podcasts_podcaster_id_fkey FOREIGN KEY (podcaster_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: slot_reservations slot_reservations_ad_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: campfire_user
--

ALTER TABLE ONLY public.slot_reservations
    ADD CONSTRAINT slot_reservations_ad_slot_id_fkey FOREIGN KEY (ad_slot_id) REFERENCES public.ad_slots(id) ON DELETE CASCADE;


--
-- Name: slot_reservations slot_reservations_advertiser_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: campfire_user
--

ALTER TABLE ONLY public.slot_reservations
    ADD CONSTRAINT slot_reservations_advertiser_id_fkey FOREIGN KEY (advertiser_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: slot_reservations slot_reservations_campaign_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: campfire_user
--

ALTER TABLE ONLY public.slot_reservations
    ADD CONSTRAINT slot_reservations_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict ymLSfK7u3E5kG3Cqkq5ehxDMatGCW7ixT5FiYdJJY1xeyxTWggqd6VLXdWKklsR

