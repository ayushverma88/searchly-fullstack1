# Searchly — Full-stack SEO dashboard

A learning project inspired by SEO SaaS products. It includes:
- React + Vite + Tailwind CSS frontend
- Express API
- MongoDB persistence for users and saved reports
- JWT authentication
- Basic HTML SEO audit for public websites
- Content checklist/keyword usage analyzer
- Save, list, and delete reports
- Responsive dashboard UI

This is a portfolio starter, not a production SEO crawler or a replica of Surfer SEO.

## Requirements
- Node.js 20.19+ or 22.12+
- MongoDB local instance or MongoDB Atlas URI

## 1. Configure backend
```bash
cd server
copy .env.example .env
```
Edit `.env`: set `MONGODB_URI` and a long random `JWT_SECRET`.

Install and run:
```bash
npm install
npm run dev
```
Backend runs at `http://localhost:5000`.

## 2. Configure frontend
Open another terminal:
```bash
cd client
npm install
npm run dev
```
Open the URL Vite prints (usually `http://localhost:5173`).

## API overview
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` (JWT)
- `POST /api/seo/analyze` (JWT)
- `POST /api/content/analyze` (JWT)
- `GET /api/reports` (JWT)
- `DELETE /api/reports/:id` (JWT)

## Important security notes
This project includes basic URL/IP checks and rate limiting, but public URL fetching is a sensitive SSRF risk. Before deploying publicly, have a security review, enforce outbound network restrictions at infrastructure level, revalidate every redirect and DNS result, and add request/response size limits and monitoring. Do not expose a raw URL-fetching service to untrusted users without those controls.
Never commit `.env`, secrets, or real user data.
