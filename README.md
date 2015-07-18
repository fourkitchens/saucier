```
███████╗ █████╗ ██╗   ██╗ ██████╗██╗███████╗██████╗
██╔════╝██╔══██╗██║   ██║██╔════╝██║██╔════╝██╔══██╗
███████╗███████║██║   ██║██║     ██║█████╗  ██████╔╝
╚════██║██╔══██║██║   ██║██║     ██║██╔══╝  ██╔══██╗
███████║██║  ██║╚██████╔╝╚██████╗██║███████╗██║  ██║
╚══════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝╚═╝╚══════╝╚═╝  ╚═╝
```

A Node.JS framework for helping you build headless Drupal websites.

## Local Development

Following these steps will ensure that you can develop locally.

- Create an `./config/env.json` file. A template is located at, `./config/_env.json`
- Ensure the `local` environment in `./config/env.json` is populated with
  - The API endpoint you want to operate against.
  - The Redis instance you want to get/set information from.
- Create an `./config/secrets.json` file. A template is located at, `./config/_secrets.json`.
- Populate the `./config/secrets.json` file. This information is intentionally excluded from Git.

### Installation

These instructions are directly related to OSX.

#### Prerequisites

- Install Homebrew. _While not directly required, this will help with any additional software you may need._
  - `ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"`
- Install Node Version Manager (NVM)
  - `curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.25.3/install.sh | bash`
  - Install the required version of Node.JS.
  - `nvm install 0.12.4`
- Install the task runner Gulp.
  - `npm install -g gulp`

#### Setup

- Execute the following commands from the root directory of the project.
  - `npm install`

Start the application with `gulp local`. The executes the build task(s) in gulp and starts the Node.JS application with [Nodemon](https://www.npmjs.com/package/nodemon).
