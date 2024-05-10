const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const csvToJson = require("convert-csv-to-json");

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const storage = multer.memoryStorage();
const upload = multer({ storage });

let userData = [];

app.use(cors());

app.get("/", (req, res) => {
	res.send("Hello World! Server");
});

app.post("/api/files", upload.single("file"), async (req, res) => {
	// 1) extract file from request
	const { file } = req;

	// 2) validate that we have file
	if (!file) {
		return res.status(500).json({
			message: "File is required.",
		});
	}

	// 3) validate that mimetype (csv)
	if (file.mimetype != "text/csv") {
		return res.status(500).json({
			message: "File must be CSV.",
		});
	}

	let json = [];
	try {
		// 4) transform file (buffer) to string
		const rawCSV = Buffer.from(file.buffer).toString("utf-8");

		// 5) transform string string to JSON
		json = csvToJson.fieldDelimiter(",").csvStringToJson(rawCSV);
	} catch (error) {
		return res.status(500).json({
			message: "Error parsing the file.",
		});
	}
	// 6) save the JSON to db (or memory)
	userData = json;

	// 7) return 200 with the message and the json
	return res.status(200).json({
		data: json,
		message: "The file was uploaded successfully.",
	});
});

app.get("/api/users", async (req, res) => {
	// 1) extract the query param 'q' from the request
	const { q } = req.query;

	// 2) validate that we have the query param
	if (!q) {
		return res.status(500).json({
			message: "Query param 'q' is required.",
		});
	}

	// 3) filter the data from the db (or memory) with the query param
	const search = q.toString().toLowerCase();

	const filteredData = userData.filter((row) => {
		return Object.values(row).some((value) =>
			value.toLowerCase().includes(search)
		);
	});

	// 4) return 200 with the filterd data
	return res.status(200).json({
		data: filteredData,
	});
	// 5) return 500 with  object with the key "message" with an error message in the value
});

app.listen(port, () => {
	console.log(`[server]: Server is running at http://localhost:${port}`);
});
