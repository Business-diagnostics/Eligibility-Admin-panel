import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: ".env" });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  console.log("Attempting to create admin user...");
  const { data, error } = await supabase.auth.signUp({
    email: "admin@business-diagnostics.com",
    password: "BDL@tool",
  });

  if (error) {
    console.error("Error creating user:", error.message);
    if (error.message.includes("already registered")) {
      console.log("User already exists. You can try logging in.");
    }
  } else {
    console.log("Success! User created:", data.user?.email);
    console.log(
      "Please check your email for a confirmation link if email confirmation is enabled.",
    );
  }
}

createAdmin();
