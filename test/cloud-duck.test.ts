import { App, Stack } from "aws-cdk-lib";
// import { CloudDuck } from "../src/index";

test('cloud-duck test', () => {
  const app = new App();
  new Stack(app, 'testing-stack');

  // new CloudDuck(stack, 'MyTestConstruct');
});