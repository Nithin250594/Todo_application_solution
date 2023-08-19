const express = require("express");
const app = express();

module.exports = app;

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializationDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3006);
  } catch (e) {
    console.log(`DB-error:${e.message}`);
    process.exit(1);
  }
};

initializationDBAndServer();

//API 1

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusAndPriority = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasStatus(request.query):
      getTodosQuery = `SELECT * FROM todo 
          WHERE todo LIKE '%${search_q}'
          AND status='${status}';`;
      break;
    case hasPriority(request.query):
      getTodosQuery = `
          SELECT * FROM todo
          WHERE todo LIKE '%${search_q}%'
          AND priority='${priority}';`;
      break;
    case hasStatusAndPriority(request.query):
      getTodosQuery = `
          SELECT * FROM todo
          WHERE todo LIKE '%${search_q}%'
          AND status='${status}' AND
          priority='${priority}';`;
      break;
    default:
      getTodosQuery = `
          SELECT * FROM todo
          WHERE todo LIKE '%${search_q}%';`;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

//API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT * FROM todo
    WHERE id=${todoId};`;

  const getTodo = await db.get(getTodoQuery);
  response.send(getTodo);
});

//API 3

app.post("/todos/", async (request, response) => {
  const postTodoDetails = request.body;
  const { id, todo, priority, status } = postTodoDetails;
  const postTodoQuery = `
    INSERT INTO todo (id,todo, priority, status)
    VALUES 
    (
        ${id},
        '${todo}',
        '${priority}',
        '${status}'
    );`;

  const postTodo = await db.run(postTodoQuery);

  response.send("Todo Successfully Added");
});

//API 4

app.put("/todos/:todoId/", async (request, response) => {
  let updatedColumn = "";
  const { todoId } = request.params;

  const getTodoDetailsQuery = `
    SELECT * FROM todo
    WHERE id=${todoId};`;
  const previousTodo = await db.get(getTodoDetailsQuery);

  const {
    status = previousTodo.status,
    priority = previousTodo.priority,
    todo = previousTodo.todo,
  } = request.body;

  const updateTodoQuery = `
    UPDATE todo
    SET todo='${todo}',
         priority='${priority}',
        status='${status}'
   WHERE id=${todoId};`;

  const updateTodo = await db.run(updateTodoQuery);

  switch (true) {
    case status !== previousTodo.status:
      updatedColumn = "Status";
      break;
    case priority !== previousTodo.priority:
      updatedColumn = "Priority";
      break;
    case todo !== previousTodo.todo:
      updatedColumn = "Todo";
      break;
  }

  response.send(`${updatedColumn} Updated`);
});

//API 5

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM todo
    WHERE id=${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
