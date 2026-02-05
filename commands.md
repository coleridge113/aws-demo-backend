# Login
curl -X POST http://localhost:3000/login \
     -H "Content-Type: application/json" \
     -d '{"username": "guest"}'

# Add lambda permission
aws lambda add-permission \
    --function-name verifyJwt \
    --principal iot.amazonaws.com \
    --source-arn arn:aws:iot:ap-southeast-1:327319899336:authorizer/CustomAuthorizer \
    --statement-id Id-123 \
    --action "lambda:InvokeFunction"


```
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET;

export const handler = async (event) => {
  const token = event.token || event.protocolData?.mqtt?.password;

    try {
        // 1. Verify the token using your Express secret
        const decoded = jwt.verify(token, JWT_SECRET);

        // 2. Return the "Allow" policy
        return {
            isAuthenticated: true,
            principalId: decoded.userId.toString(),
            policyDocuments: [{
                Version: "2012-10-17",
                Statement: [{
                    Action: "iot:*", // Be more restrictive in production!
                    Effect: "Allow",
                    Resource: "*"
                }]
            }]
        };
    } catch (err) {
        console.error("JWT Validation failed:", err.message);
        return { isAuthenticated: false };
    }
};
```

# Test verifyJwt Lambda
./test-authorizer.sh "<jwt_token>"
