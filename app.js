//app.js sets up the express server, defines routes, middleware, and integrates handlebars
//Some lines in here and in the rest of the files are from chatgpt to help debug. Most of them are logging statements to diagnose a problem.

require('dotenv').config();

const express = require("express");
const exphbs = require("express-handlebars");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const movieRoutes = require("./routes/movies");
const MOVIES_FILE = path.join(__dirname, "data", "movies.json");

fs.access(MOVIES_FILE, fs.constants.W_OK, (err) => {
    if (err) {
        console.error("No write permission for movies.json:", err);
    } else {
        console.log("movies.json is writable");
    }
});

// Middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use("/movies", movieRoutes);

const hbs = exphbs.create({
    extname: "hbs",
    defaultLayout: "main",
    helpers: {
        eq: function (a, b) {
            return a === b;
        }
    }
});

app.engine("hbs", exphbs.engine({ extname: "hbs", defaultLayout: "main" }));
app.set("view engine", "hbs");

// Renders index.hbs 
app.get("/", (req, res) => {
    const movies = movieRoutes.readMovies();
    const unwatched = movies.filter(movie => !movie.watched);
    console.log("Unwatched movies:", unwatched);
    res.render("index", { title: "Movie Watchlist", movies: unwatched, isHomeActive: true });
});

// Watched movies page
app.get("/watched", (req, res) => {
    const movies = movieRoutes.readMovies().filter(movie => movie.watched);
    res.render("watched", { title: "Watched Movies", movies, isWatchedActive: true });
});

// Movie detail page
app.get("/movies/:id", (req, res) => {
    const movies = movieRoutes.readMovies();
    const movie = movies.find(m => m.id == parseInt(req.params.id));
    if (!movie) {
        return res.status(404).render("404", { message: "Movie not found" });
    }
    res.render("movie", { title: movie.title, movie });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});





