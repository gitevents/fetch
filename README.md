# GitEvents Fetch

Fetch events and talks from a gitevents-based GitHub repository..

```bash
openssl pkcs8 -topk8 -inform PEM -outform PEM -nocrypt -in keyile.private-key.pem -out private-key-pkcs8.key
```

Convert private key to base64 to store as environment variable:

```js
const privateKey = fs.readFileSync('private-key-pkcs8.key', 'utf8')
const buff = Buffer.from(privateKey).toString('base64')
console.log(buff)
```
