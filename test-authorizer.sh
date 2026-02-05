#!/bin/bash

JWT_TOKEN="$1"

# 1. Basic sanity check: Is it roughly a JWT? (contains at least two dots)
if [[ -z "$JWT_TOKEN" ]] || [[ "$JWT_TOKEN" != *.*.* ]]; then
    echo "❌ Error: That doesn't look like a JWT."
    echo "Usage: $0 <your_jwt_token>"
    exit 1
fi

echo "✅ JWT format detected. Encoding..."

# 2. Encode to Base64 and strip newlines (tr -d)
ENCODED_TOKEN=$(echo -n "$JWT_TOKEN" | base64 | tr -d '\n')

# 3. Optional: Try to copy to clipboard
if command -v xclip >/dev/null; then
    echo -n "$ENCODED_TOKEN" | xclip -selection clipboard
    echo "📋 Encoded token copied to clipboard."
fi

# 4. Run the AWS Command
# We use double quotes (") for the context so $ENCODED_TOKEN expands.
# We escape the internal quotes (\") so they are sent to the CLI.
aws iot test-invoke-authorizer \
    --authorizer-name CustomAuthorizer \
    --mqtt-context "{\"username\": \"guest\", \"password\": \"$ENCODED_TOKEN\", \"clientId\": \"mobile-client\"}"
