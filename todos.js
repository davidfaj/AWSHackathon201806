const config = require('./config.js');
const AWS = require('aws-sdk');
let bucket = config.bucket;
let key = config.key;
const allowedOrigin = config.allowedOrigin;

// Lambda function
exports.handler = async (event, context, callback) => {
  let message = '';
  // Handle API methods
  try {
    if (event.httpMethod == 'OPTIONS') {
      message = 'Allowed methods: OPTIONS, GET, POST, PUT, DELETE';
    }
    else if (event.httpMethod == 'GET') {
      message = await getDataFromS3();
    }
    else if (event.httpMethod == 'POST') {
      message = await createTodo(event.body);
    }
    else if (event.httpMethod == 'PUT') {
      message = await updateTodo(event.body);
    }
    else if (event.httpMethod == 'DELETE') {
      message = await deleteTodo(event.queryStringParameters.id);
    }
    else {
      message = 'HTTP method not allowed';
    }
    // Respond to API caller
    callback(null, response(message));
  } catch (err) {
    // Respond to API caller
    callback(null, response(message, 500));
  }
};


// Function to fill response to API caller
function response(body, statusCode) {
  return {
    statusCode: (statusCode ? statusCode : 200),
    headers: {
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Methods": "GET,DELETE,POST,PUT,OPTIONS",
      "Access-Control-Allow-Headers": "*"
    },
    body: JSON.stringify(body)
  }
};
/* OBS. for Level 4 ("- Configure the Api to allow requests from ONLY that S3 static site using CORS."):
As we are using Proxy Integration with API and Lambda, CORS need to be set as headers in Lambda.
Setting in API console doesn't work (see: https://forums.aws.amazon.com/thread.jspa?threadID=243769).
*/


// Function to get todos from S3 bucket
function getDataFromS3() {
  //const s3 = new AWS.S3();
  let s3Params = {Bucket: bucket, Key: key};
  return new Promise( (resolve, reject) => {
    (new AWS.S3()).getObject(s3Params, (err, data) => {
      if (err) return reject(err);
      resolve(JSON.parse(data.Body.toString('utf-8')));
    });
  });
};


// Function to save todos in S3 bucket
function saveDataToS3(todos) {
  return new Promise( (resolve, reject) => {
    let s3Params = {Bucket: bucket, Key: key, Body: JSON.stringify(todos), ContentType: 'application/json'}; // set ContentType to open file direclty in browser, when using S3 console (without it, file is saved to computer, then need to open it)
    (new AWS.S3()).putObject(s3Params, (err, data) => {
      if (err) return reject(err);
      resolve();
    });
  });
}


// Function to create a todo
// On resource action method POST, create a to do item to data store. Return a single to do json as the api response.
function createTodo(todo) {
  return new Promise( (resolve, reject) => {
    // Get all todos from S3 bucket
    getDataFromS3()
      // Then add the new todo to the array
      .then( (todos) => {
        // Assign new todo with (last id number + 1)
        let maxId = todos[todos.length - 1].id;
        todo = JSON.parse(todo);
        todo.id = maxId + 1;
        todos.push(todo);
        return todos;
      })
      // Then save the new todos array to S3 bycket
      .then( (todos) => {
        saveDataToS3(todos);
        return resolve(todo); // Return the new todo
      });
  });
};


// Function to delete a todo
// On resource action method DELETE resource, delete a to do item to data store. Return nothing from api response.
function deleteTodo(id) {
  return new Promise( (resolve, reject) => {
    // Get all todos from S3 bucket
    getDataFromS3()
    // Then delete the todo from the array
    .then( (todos) => {
      let i;
      let numTodos = todos.length;
      for (i = 0; i < numTodos; i++) {
        if (todos[i].id == id) {
          todos.splice(i, 1);
          break;
        }
      }
      return todos;
    })
    // Then save the new todos array to S3 bycket
    .then( (todos) => {
      saveDataToS3(todos);
      return resolve(); // return nothing
    });
  });
};


// Function to update a todo
// On resource action method PUT resource, update a to do item. Return item from api response.
function updateTodo(todo) {
  return new Promise( (resolve, reject) => {
    // Get all todos from S3 bucket
    getDataFromS3()
    // Then update the todo in the array
    .then( (todos) => {
      todo = JSON.parse(todo);
      let i;
      let numTodos = todos.length;
      for (i = 0; i < numTodos; i++) {
        if (todos[i].id == todo.id) {
          todos[i].completed = todo.completed;
          break;
        }
      }
      return todos;
    })
    // Then save the new todos array to S3 bycket
    .then( (todos) => {
      saveDataToS3(todos);
      return resolve(todo); // Return the new todo
    });
  });
};
