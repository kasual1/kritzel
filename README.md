# Developer Guide
Currently this serves as a short guide to remember important concepts and commands that are often used during development. 

The main development of the kritzel-library is taking place under "libs/kritzel-stencil". The other directories under "libs" are the output target of stencil. With every new build stencil automatically generates code in those directories and generates their bundles, which later may be published to npm. Demo applications for testing can be found under "demos".

## Workflow
The general workflow when working on the library may look as follows:

1. Add or edit components under "libs/kritzel-stencil"
2. Build libraries for all configured output targets, namely: Angular, React and Vue
3. Test the libraries of respective output target in the demo applications
4. When a feature is ready and has been tested with the demo applications, bump up the libraries version
5. Publish the library to npm

## Useful Commands
To support the development workflow of "Kritzel" the following commands may be used. All actions should be execute from the root directory. 

1. Install dependencies of the main directory as well as all sub-directories `npm install`
2. Bump up the version of the libraries (Choose what part of the semver version number you want to increase)
	- `npm run bump-patch`
	- `npm run bump-minor`
	- `npm run bump-major`
3. Build the libraries for each output target `npm run build`
4. Use the respective library in one of the demo applications for testing
	-  `npm run start-demo-angular`, 
	-  `npm run start-demo-react`, 
	-  `npm run start-demo-vue`
5. Publish the libraries to npm `npm run publish`
6. Sometimes it's necessary to remove all node_modules and dist folders. Run `npm run clean`
