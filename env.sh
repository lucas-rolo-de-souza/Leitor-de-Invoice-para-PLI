#!/bin/sh
# Recreate config file
rm -rf /usr/share/nginx/html/env-config.js
touch /usr/share/nginx/html/env-config.js

# Add assignment 
echo "window._env_ = {" >> /usr/share/nginx/html/env-config.js

# Read each line in .env file
# Each line represents key=value pairs
echo "  VITE_SUPABASE_URL: \"${VITE_SUPABASE_URL}\"," >> /usr/share/nginx/html/env-config.js
echo "  VITE_SUPABASE_ANON_KEY: \"${VITE_SUPABASE_ANON_KEY}\"," >> /usr/share/nginx/html/env-config.js

echo "};" >> /usr/share/nginx/html/env-config.js

# Execute the passed command (nginx)
exec "$@"
