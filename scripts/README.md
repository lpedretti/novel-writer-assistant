# User Management Scripts

These scripts provide command-line tools for managing users in the Reverie Capsule database.

## Prerequisites

- Node.js installed
- Database configured and migrations applied
- `.env` file with `DATABASE_URL` set

## Available Scripts

### 1. List Users

View all users in the database with their details.

```bash
npm run list-users
```

**Output:**
- Email address
- Name
- Role
- Email verification status
- Creation date
- User ID

---

### 2. Add Admin User

Create a new administrator user with email already verified.

```bash
npm run add-admin <email> <password> [name]
```

**Parameters:**
- `email` (required) - User's email address
- `password` (required) - User's password (min 8 characters)
- `name` (optional) - User's display name (defaults to email prefix)

**Example:**
```bash
npm run add-admin admin@example.com SecurePass123! "Admin User"
```

**Features:**
- Automatically hashes password with bcrypt
- Sets role to ADMINISTRATOR
- Marks email as verified
- Prevents duplicate email addresses

---

### 3. Change Password

Update an existing user's password.

```bash
npm run change-password <email> <new-password>
```

**Parameters:**
- `email` (required) - User's email address
- `new-password` (required) - New password (min 8 characters)

**Example:**
```bash
npm run change-password user@example.com NewSecurePass123!
```

**Features:**
- Validates user exists
- Hashes new password with bcrypt
- Maintains minimum password length requirement

---

### 4. Change Role

Update a user's role/permissions.

```bash
npm run change-role <email> <role>
```

**Parameters:**
- `email` (required) - User's email address
- `role` (required) - New role (ADMINISTRATOR, CREATOR, or VIEWER)

**Available Roles:**
- `ADMINISTRATOR` - Full system access, user management
- `CREATOR` - Can create and manage books
- `VIEWER` - Can read books only (default for new users)

**Example:**
```bash
# Promote user to creator
npm run change-role user@example.com CREATOR

# Promote user to admin
npm run change-role user@example.com ADMINISTRATOR

# Demote user to viewer
npm run change-role user@example.com VIEWER
```

**Features:**
- Validates user exists
- Validates role is valid
- Shows old and new role in output

---

## Common Workflows

### Initial Setup - Create First Admin

After setting up the database, create your first admin user:

```bash
npm run add-admin admin@yourdomain.com YourSecurePassword123! "Administrator"
```

### Promote Existing User to Admin

```bash
npm run change-role user@example.com ADMINISTRATOR
```

### Reset User Password

```bash
npm run change-password user@example.com TemporaryPass123!
```

### View All Users

```bash
npm run list-users
```

---

## Security Notes

- All passwords are hashed using bcrypt before storage
- Admin users created via script have email auto-verified
- Minimum password length is 8 characters
- Scripts require direct database access via Prisma

---

## Troubleshooting

**Error: User already exists**
- Check with `npm run list-users` to see existing users

**Error: User not found**
- Verify the email address is correct
- Use `npm run list-users` to see all users

**Error: Invalid role**
- Valid roles are: ADMINISTRATOR, CREATOR, VIEWER (case-insensitive)

**Database connection error**
- Ensure `.env` file has correct `DATABASE_URL`
- Verify database is running
- Run `npx prisma generate` if Prisma Client is out of sync
