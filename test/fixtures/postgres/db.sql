CREATE TABLE "user"(
    id SERIAL PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    age INT
);

CREATE TABLE "company"(
   id INT PRIMARY KEY     NOT NULL,
   name           TEXT    NOT NULL,
   age            INT     NOT NULL,
   address        CHAR(50),
   salary         REAL
);
