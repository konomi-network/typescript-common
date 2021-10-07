# typescript-common
Typescript common util library for both Frontend and Backend usage

### Installation

1. Install yarn globally (needed to resolve dependencies correctly when working in a monorepo)

   ```shell
   npm install -g yarn
   ```

2. Install NPM packages

   ```shell
   yarn install
   ```

3. Run all the examples

   ```shell
   yarn run test
   ```

4. before run ipfs daemon
   ```
   ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "GET", "POST", "OPTIONS"]'
   ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'
   ipfs config --json API.HTTPHeaders.Access-Control-Allow-Credentials '["true"]'
   ipfs config --json API.HTTPHeaders.Access-Control-Allow-Headers '["Authorization"]'
   ipfs config --json API.HTTPHeaders.Access-Control-Expose-Headers '["Location"]'
   ipfs daemon
   ```
