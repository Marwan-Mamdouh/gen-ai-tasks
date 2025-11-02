import mongoose from "mongoose";
import { OpenAIEmbeddings } from "@langchain/openai";

process.loadEnvFile(".env");

await mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("connected"))
  .catch(() => console.error("something went wrong"));

const coursesModel = new mongoose.model(
  "courses",
  new mongoose.Schema({
    courseName: { type: String },
    description: { type: String },
    embedding: { type: [Number] },
  })
);

// const coursesData = [
//   {
//     courseName: "Introduction to JavaScript",
//     description:
//       "Fundamentals of JS, syntax, DOM, and basic programming concepts.",
//   },
//   {
//     courseName: "Advanced Node.js",
//     description:
//       "Deep dive into Node.js core, performance, streams, and clustering.",
//   },
//   {
//     courseName: "Express.js from Zero to Hero",
//     description:
//       "Build REST APIs, middleware, routing, and error handling with Express.",
//   },
//   {
//     courseName: "MongoDB Essentials",
//     description:
//       "CRUD operations, schema design, aggregation, and indexing in MongoDB.",
//   },
//   {
//     courseName: "Full-Stack Web Development",
//     description:
//       "Client-server architecture, RESTful APIs, and frontend/back-end integration.",
//   },
//   {
//     courseName: "React Fundamentals",
//     description:
//       "Components, state, props, hooks, and building interactive UIs with React.",
//   },
//   {
//     courseName: "Advanced React Patterns",
//     description:
//       "Context, performance optimization, custom hooks, and design patterns.",
//   },
//   {
//     courseName: "TypeScript for JavaScript Developers",
//     description:
//       "Types, interfaces, generics, and migrating JS projects to TypeScript.",
//   },
//   {
//     courseName: "Frontend Testing with Jest",
//     description:
//       "Unit and snapshot testing for React and plain JS using Jest and testing-library.",
//   },
//   {
//     courseName: "CSS Layouts and Responsive Design",
//     description:
//       "Flexbox, Grid, media queries, and building responsive interfaces.",
//   },
//   {
//     courseName: "Python for Data Analysis",
//     description:
//       "Pandas, NumPy, data cleaning, and exploratory analysis with Python.",
//   },
//   {
//     courseName: "Machine Learning Basics",
//     description:
//       "Supervised/unsupervised learning, feature engineering, and model evaluation.",
//   },
//   {
//     courseName: "Docker & Containerization",
//     description:
//       "Container lifecycle, Dockerfiles, images, and basic orchestration concepts.",
//   },
//   {
//     courseName: "CI/CD with GitHub Actions",
//     description:
//       "Automate testing, builds, and deployments using GitHub Actions workflows.",
//   },
//   {
//     courseName: "GraphQL API Development",
//     description:
//       "Schema design, resolvers, queries, mutations, and GraphQL best practices.",
//   },
//   {
//     courseName: "Data Structures & Algorithms",
//     description:
//       "Core DS/algorithms, complexity analysis, and problem-solving techniques.",
//   },
//   {
//     courseName: "Security Best Practices for Web Apps",
//     description:
//       "Authentication, authorization, OWASP top 10, and secure coding practices.",
//   },
//   {
//     courseName: "Mobile Web Performance",
//     description:
//       "Performance metrics, lazy loading, code-splitting, and optimizing for mobile.",
//   },
//   {
//     courseName: "Serverless with AWS Lambda",
//     description:
//       "Function-as-a-service concepts, deploying Lambdas, and event-driven design.",
//   },
//   {
//     courseName: "DevOps Fundamentals",
//     description:
//       "Infrastructure as code, monitoring, logging, and collaboration between dev and ops.",
//   },
// ];

const embeddings = new OpenAIEmbeddings({ apiKey: process.env.OPENAI_API_KEY });

// coursesData?.forEach(async (course) => {
//   const [embedding] = await embeddings.embedDocuments([course.description]);
//   const newCourse = new coursesModel({
//     courseName: course.courseName,
//     description: course.description,
//     embedding,
//   });
//   await newCourse.save();
//   console.log(course.courseName);
// });

const query = "what is the best course do you have to learn backend";
const queryEmbedding = await embeddings.embedQuery(query);

const pipeline = [
  {
    $vectorSearch: {
      index: "vector_index",
      queryVector: queryEmbedding,
      path: "embedding",
      numCandidates: 10,
      limit: 1,
    },
  },
  { $project: { _id: 0, courseName: 1, description: 1 } },
];
setTimeout(async () => {
  const call = await mongoose.connection.db
    .collection("courses")
    .aggregate(pipeline)
    .toArray();
  console.log(call);
}, 5000);
