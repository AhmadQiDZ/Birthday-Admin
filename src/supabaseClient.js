import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wwuycqlzmpmduylmmprs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3dXljcWx6bXBtZHV5bG1tcHJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4Njg1NDQsImV4cCI6MjA5NjQ0NDU0NH0.Fl2JtxgGF_2j9iSHMP0z_XLUD2ATN3NRzpohEeNfJIc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)