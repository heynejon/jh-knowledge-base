#!/bin/bash
# Start the backend server with Python 3.10

cd "$(dirname "$0")"
/opt/homebrew/bin/python3.10 -m uvicorn main:app --reload --port 8000 --host 127.0.0.1