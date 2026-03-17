import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://daxptnybsofquelczugc.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRheHB0bnlic29mcXVlbGN6dWdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4MDIyNzksImV4cCI6MjA4NjM3ODI3OX0.b4ZzDY524NoXrr7C8vHhbHmzY1aRmoJocauwaN5C0Pw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
