const config = {
  bucket: '<your-todos-json-bucket>',
  key: 'todos.json',
  allowedOrigin: 'http://<your-todo-app-bucket>.s3-website-<your-todo-app-region>.amazonaws.com'
};
module.exports = config;