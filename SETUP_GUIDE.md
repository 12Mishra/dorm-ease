# DormEase - Database Setup Guide

## Problem Summary

You're experiencing the following issues:
1. `/api/rooms` route timing out (500 error)
2. No dropdown data in `/hostels` page
3. No data in admin dashboard

## Root Cause

Your application is trying to connect to Aiven MySQL, but:
- SSL configuration was missing
- Database schema hasn't been imported to Aiven
- Environment variables not configured properly

## Solution Steps

### Step 1: Update Your `.env` File

Create or update your `.env` file in the root directory with your Aiven credentials:

```bash
# Database Configuration for Aiven MySQL
DATABASE_HOST=mysql-24feda1b-cascade2412-40f9.c.aivencloud.com
DATABASE_PORT=15560
DATABASE_USER=avnadmin
DATABASE_PASSWORD=YOUR_ACTUAL_PASSWORD_HERE
DATABASE_NAME=defaultdb
DATABASE_SSL_MODE=REQUIRED

# Prisma Database URL
DATABASE_URL="mysql://avnadmin:YOUR_ACTUAL_PASSWORD_HERE@mysql-24feda1b-cascade2412-40f9.c.aivencloud.com:15560/defaultdb?ssl-mode=REQUIRED"
```

**⚠️ IMPORTANT:** Replace `YOUR_ACTUAL_PASSWORD_HERE` with your actual password!

### Step 2: Update Database Schema for Aiven

The `db/dormease.sql` file is configured for a local database named `hostelhive`. We need to modify it for Aiven's `defaultdb`.

Create a new file `db/aiven-setup.sql` with the updated schema:

```sql
-- ====================================================================
-- DormEase - Aiven MySQL Setup
-- ====================================================================

-- Use the Aiven database
USE defaultdb;

SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS beds;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS hostels;
DROP TABLE IF EXISTS students;

-- Drop existing views
DROP VIEW IF EXISTS view_hostel_occupancy;
DROP VIEW IF EXISTS view_revenue_by_hostel;
DROP VIEW IF EXISTS view_available_beds;

-- Drop existing procedures
DROP PROCEDURE IF EXISTS AllocateBed;

-- Drop existing triggers
DROP TRIGGER IF EXISTS prevent_double_booking;
DROP TRIGGER IF EXISTS update_booking_on_payment;

SET FOREIGN_KEY_CHECKS = 1;

-- Now run the rest of the schema from dormease.sql
-- (Copy everything from line 17 onwards from dormease.sql, EXCEPT the DROP DATABASE and CREATE DATABASE lines)
```

### Step 3: Import the Schema to Aiven

Run the following command to import the schema:

```bash
mysql --user=avnadmin --host="mysql-24feda1b-cascade2412-40f9.c.aivencloud.com" --port=15560 --ssl-mode=REQUIRED -p defaultdb < db/dormease.sql
```

**OR** you can manually execute the SQL using a client like MySQL Workbench or DBeaver.

### Step 4: Generate Prisma Client

After setting up the database, regenerate the Prisma client:

```bash
npx prisma generate
```

### Step 5: Test the Connection

Test if Prisma can connect to your database:

```bash
npx prisma db pull
```

This will sync your Prisma schema with the actual database.

### Step 6: Restart the Development Server

Stop the current dev server (Ctrl+C) and restart it:

```bash
npm run dev
```

## Verification

After completing the steps above, verify:

1. ✅ `/api/hostels` returns hostel data
2. ✅ `/api/rooms` returns room data (without timeout)
3. ✅ `/hostels` page shows dropdown with hostel names
4. ✅ `/admin` dashboard shows statistics

## Troubleshooting

### If you still get errors:

1. **Check database connection:**
   ```bash
   mysql --user=avnadmin --host="mysql-24feda1b-cascade2412-40f9.c.aivencloud.com" --port=15560 --ssl-mode=REQUIRED -p
   ```

2. **Verify tables exist:**
   ```sql
   USE defaultdb;
   SHOW TABLES;
   ```

3. **Check if views exist:**
   ```sql
   SHOW FULL TABLES WHERE Table_type = 'VIEW';
   ```

4. **Verify sample data:**
   ```sql
   SELECT COUNT(*) FROM hostels;
   SELECT COUNT(*) FROM rooms;
   SELECT COUNT(*) FROM beds;
   ```

### Common Errors:

- **"Access denied"** - Check your password in `.env`
- **"Unknown database"** - Make sure you're using `defaultdb`
- **"Table doesn't exist"** - Import the schema again
- **"SSL connection error"** - Ensure `DATABASE_SSL_MODE=REQUIRED` is set

## Quick Fix Script

I'll create a simplified SQL file that's ready for Aiven import.
