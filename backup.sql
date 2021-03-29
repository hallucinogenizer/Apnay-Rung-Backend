--
-- PostgreSQL database dump
--

-- Dumped from database version 13.1
-- Dumped by pg_dump version 13.1

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

--
-- Name: admin_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.admin_id_seq OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    admin_id integer DEFAULT nextval('public.admin_id_seq'::regclass) NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(60) NOT NULL,
    profile_picture character varying(1000)
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- Name: TABLE admins; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.admins IS 'This table contains the account information of all admin users. Password will use SHA256 encryption which yields a 64-character string.';


--
-- Name: customer_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customer_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.customer_id_seq OWNER TO postgres;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    customer_id integer DEFAULT nextval('public.customer_id_seq'::regclass) NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(60) NOT NULL,
    address character varying(300) NOT NULL,
    phone character varying(18),
    blocked boolean DEFAULT false NOT NULL,
    sec_questions json
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: TABLE customers; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.customers IS 'This table contains the account information of all buyers (customers). Password will use SHA256 encryption which yields a 64-character string.';


--
-- Name: item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.item_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.item_id_seq OWNER TO postgres;

--
-- Name: inventory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory (
    item_id integer DEFAULT nextval('public.item_id_seq'::regclass) NOT NULL,
    title character varying(100) NOT NULL,
    description text,
    image character varying(1000)[] NOT NULL,
    category character varying(50) NOT NULL,
    seller_id integer NOT NULL,
    price integer NOT NULL
);


ALTER TABLE public.inventory OWNER TO postgres;

--
-- Name: TABLE inventory; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.inventory IS 'This table will contain a list of all products on the website.';


--
-- Name: message_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.message_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.message_id_seq OWNER TO postgres;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    message_id integer DEFAULT nextval('public.message_id_seq'::regclass) NOT NULL,
    subject character varying(100) NOT NULL,
    content text NOT NULL,
    customer_id integer NOT NULL,
    "timestamp" timestamp without time zone NOT NULL
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: notif_id_sequence; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notif_id_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.notif_id_sequence OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    notification_id integer DEFAULT nextval('public.notif_id_sequence'::regclass) NOT NULL,
    title character varying(100) NOT NULL,
    type character varying(50) NOT NULL,
    details character varying(500),
    customer_id integer,
    seller_id integer,
    admin_id integer,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: order_id_sequence; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_id_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.order_id_sequence OWNER TO postgres;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    order_id integer DEFAULT nextval('public.order_id_sequence'::regclass) NOT NULL,
    "timestamp" timestamp without time zone NOT NULL,
    customer_id integer NOT NULL,
    delivery_status character varying(50) NOT NULL,
    review text,
    totalamount double precision NOT NULL,
    cancelled boolean DEFAULT false NOT NULL,
    name character varying(100),
    email character varying(100),
    phone character varying(18),
    b_address character varying(300),
    s_address character varying(300),
    items integer[] NOT NULL,
    seller_ids integer[]
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: TABLE orders; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.orders IS 'This table will contain information about all orders placed.';


--
-- Name: seller_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seller_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.seller_id_seq OWNER TO postgres;

--
-- Name: sellers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sellers (
    seller_id integer DEFAULT nextval('public.seller_id_seq'::regclass) NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(60) NOT NULL,
    cnic character(13) NOT NULL,
    location character varying(100) NOT NULL,
    bio text,
    weeklyartisan boolean DEFAULT false NOT NULL,
    blocked boolean DEFAULT true NOT NULL,
    profile_picture character varying(1000),
    cnic_image character varying(1000),
    sec_questions json
);


ALTER TABLE public.sellers OWNER TO postgres;

--
-- Name: TABLE sellers; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.sellers IS 'This table contains the account information of all sellers (artisans). Password will use SHA256 encryption which yields a 64-character string.';


--
-- Name: COLUMN sellers.weeklyartisan; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.sellers.weeklyartisan IS 'Default value false';


--
-- Name: tutorial_id_sequence; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tutorial_id_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.tutorial_id_sequence OWNER TO postgres;

--
-- Name: tutorials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tutorials (
    tutorial_id integer DEFAULT nextval('public.tutorial_id_sequence'::regclass) NOT NULL,
    title character varying NOT NULL,
    content text
);


ALTER TABLE public.tutorials OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    firstname character varying(255) NOT NULL,
    lastname character varying(255)
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admins (admin_id, name, email, password, profile_picture) FROM stdin;
1	Muhammad Rohan	rohan@yahoo.com	$2b$10$EsT1Bll2X55fY1486EP/bOdQAmEdhHFJR98wW.5bcyQrlSyGoDUDy	
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (customer_id, name, email, password, address, phone, blocked, sec_questions) FROM stdin;
17	Taimoor Tariq	taimoor@gmail.com	$2b$10$jDPqfVxh6622xYTAiQLo6.t1Jp/mQFoEzgBB7ZQVwxglSsj.eBoc2	Jupiter	\N	f	\N
18	Momina Amer	momina@gmail.com	$2b$10$MYOax/jlDZsFji5Ckemi/.kZjohl15/prDo8.L/gCZLELJIUsOCqi	Pluto	\N	t	\N
15	Areeba Azam	areeba1@yahoo.com	$2b$10$GHCOu8GxaZJF8PG4Hin18uQCuiICdyk0.48/cPmlsy3bU9vJuRCaW	Lahore, Punjab, Pakistan	\N	f	\N
\.


--
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inventory (item_id, title, description, image, category, seller_id, price) FROM stdin;
1	Ajrak	description	{image.jpg}	clothing	5	500
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (message_id, subject, content, customer_id, "timestamp") FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (notification_id, title, type, details, customer_id, seller_id, admin_id, "timestamp") FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (order_id, "timestamp", customer_id, delivery_status, review, totalamount, cancelled, name, email, phone, b_address, s_address, items, seller_ids) FROM stdin;
1	2021-03-28 21:27:29.010254	17	processing	I did not like the product	0	f	Rohan	rohan@yahoo.com	+923025474222	\N	\N	{{1,2,500},{2,3,1000}}	{5}
\.


--
-- Data for Name: sellers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sellers (seller_id, name, email, password, cnic, location, bio, weeklyartisan, blocked, profile_picture, cnic_image, sec_questions) FROM stdin;
5	Taimoor Tariq	taimoor@gmail.com	$2b$10$K/13mk0FfXL3VC.ziBTuiO5qPXceJhVzt4EJzpLnH4IMmKgKfgC/u	3520212345678	Sindh	\N	f	t	\N	taimoortariq_cnic.jpg	{"What is the name of your cat?":"Ihsan","What is the name of your best friend?":"Ihsan"}
6	Maham Ghazanfar	maham@gmail.com	$2b$10$BQo.4dVoloCuIoyEvz1bHe8dpNUAJZIVizWae598WuLvn91QRs8am	3520212345678	Kashmir	\N	f	t	\N	maham_cnic.jpg	{"What is the name of your cat?":"Ihsan","What is the name of your best friend?":"Ihsan"}
4	Shafay Shumail	shafay@gmail.com	$2b$10$iVzV313phijc3VOFStsS5.ouHld5sQDTd0hb50MjwQnw0sK0IeMZ6	3520212345678	Lahore	Wot?	f	t	\N	vafabatool.jpg	{"What is the name of your cat?":"Junaid","What is the name of your best friend?":"Junaid"}
\.


--
-- Data for Name: tutorials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tutorials (tutorial_id, title, content) FROM stdin;
1	Test Tutorial 1	<iframe width="560" height="315" src="https://www.youtube.com/embed/eBMiX79QegY" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, firstname, lastname) FROM stdin;
1	Rohan	Hussain
5	Rohan	Hussain
6	Rohan	Hussain
7	Rohan	Hussain
8	Rohan	Hussain
\.


--
-- Name: admin_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_id_seq', 1, true);


--
-- Name: customer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customer_id_seq', 18, true);


--
-- Name: item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.item_id_seq', 1, true);


--
-- Name: message_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.message_id_seq', 2, true);


--
-- Name: notif_id_sequence; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notif_id_sequence', 2, true);


--
-- Name: order_id_sequence; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_id_sequence', 1, true);


--
-- Name: seller_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.seller_id_seq', 6, true);


--
-- Name: tutorial_id_sequence; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tutorial_id_sequence', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 8, true);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (admin_id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (customer_id);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (item_id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (message_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notification_id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);


--
-- Name: sellers sellers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sellers
    ADD CONSTRAINT sellers_pkey PRIMARY KEY (seller_id);


--
-- Name: tutorials tutorials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutorials
    ADD CONSTRAINT tutorials_pkey PRIMARY KEY (tutorial_id);


--
-- Name: admins unique_admin_email; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT unique_admin_email UNIQUE (email);


--
-- Name: customers unique_customer_email; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT unique_customer_email UNIQUE (email);


--
-- Name: sellers unique_seller_email; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sellers
    ADD CONSTRAINT unique_seller_email UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: messages messages_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id) NOT VALID;


--
-- Name: notifications notifications_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(admin_id) NOT VALID;


--
-- Name: notifications notifications_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id) NOT VALID;


--
-- Name: notifications notifications_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.sellers(seller_id) NOT VALID;


--
-- PostgreSQL database dump complete
--

