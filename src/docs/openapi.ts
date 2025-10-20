// Loads the OpenAPI YAML spec and exports it as a JS object.

import fs from "fs";
import path from "path";
import YAML from "yaml";

const specPath = path.join(__dirname, "openapi.yaml");
const file = fs.readFileSync(specPath, "utf8");
export const openapiSpec = YAML.parse(file);