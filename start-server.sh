
#!/bin/bash

echo "Starting local server for Orc Battle Arena..."
echo
echo "Open your browser and go to: http://localhost:8000/Orcs.html"
echo
echo "Press Ctrl+C to stop the server"
echo
python3 -m http.server 8000
read -p "Press any key to continue..."