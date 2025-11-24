import { SessionOptions } from "iron-session";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "student" | "admin" | "super_admin";
  gender?: string;
  year?: number;
  hasBooking?: boolean;
  department?: string;
  phone?: string;
  isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD || "complex_password_at_least_32_characters_long",
  cookieName: "dorm-ease-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
};

// This is where we specify the typings of req.session.*
declare module "iron-session" {
  interface IronSessionData {
    user?: User;
  }
}

export type SessionData = {
  user?: User;
};
