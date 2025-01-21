# initialize

	mkdir hoffnungland-backend-app
	cd hoffnungland-backend-app
	npm init -y
	npm install express body-parser cors pg crypto uuid nodemailer zod
	npm install dotenv --save
	npm install --save-dev typescript @types/node @types/express @types/pg @types/nodemailer tsx
	npx tsc --init
	mkdir src
	
	code .

## tsconfig.json
	{
		"compilerOptions": {
			"target": "ES2022",                    // Modern JavaScript features
			"module": "CommonJS",                  // For Node.js compatibility
			"rootDir": "./src",                    // Source files directory
			"outDir": "./dist",                    // Compiled output directory
			"esModuleInterop": true,               // Enables compatibility with ES modules
			"strict": true,                        // Enforces strict type-checking
			"skipLibCheck": true,                  // Skips type-checking of declaration files
			"forceConsistentCasingInFileNames": true
		}
	}

	"module": "ES2022",
	"typeRoots": ["./node_modules/@types"]

## package.json

	"scripts": {
		"build": "tsc",
		"start": "node dist/server.js",
		"dev": "node --import=tsx src/server.ts"
	}

execute shortcut using: npm run {build|start|dev}

dev doesn't work. use npx tsx src/server.ts to run without compile first.

# build

	npx tsc

npx is a tool that allows you to run Node.js packages without installing them globally

# run

	npx tsx src/server.ts
	node dist/server.js

# run on server

	sudo npm install -g pm2
	pm2 start server.js
	pm2 save
	pm2 startup


[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/K3K441XSO)