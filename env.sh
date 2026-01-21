#!/bin/sh
# Recreate config file
rm -rf /usr/share/nginx/html/env-config.js
touch /usr/share/nginx/html/env-config.js

# Add assignment 
echo "window._env_ = {" >> /usr/share/nginx/html/env-config.js

# Find latest NCM file (Dynamic Loading)
# We look for files matching Tabela_NCM_Vigente_*.json in the web root
# We sort -r (reverse) to hopefully get the latest date if multiple exist
# and pick the first one.
NCM_FILE=$(cd /usr/share/nginx/html && ls Tabela_NCM_Vigente_*.json 2>/dev/null | sort -r | head -n 1)

if [ -z "$NCM_FILE" ]; then
  # Fallback provided by code default, but let's be explicit
  echo "  NCM_FILENAME: \"ncm.json\"," >> /usr/share/nginx/html/env-config.js
else
  echo "  NCM_FILENAME: \"$NCM_FILE\"," >> /usr/share/nginx/html/env-config.js
fi

# Read each line in .env file
# Each line represents key=value pairs
echo "  VITE_SUPABASE_URL: \"${VITE_SUPABASE_URL}\"," >> /usr/share/nginx/html/env-config.js
echo "  VITE_SUPABASE_ANON_KEY: \"${VITE_SUPABASE_ANON_KEY}\"," >> /usr/share/nginx/html/env-config.js

echo "};" >> /usr/share/nginx/html/env-config.js

# Execute the passed command (nginx)
exec "$@"
