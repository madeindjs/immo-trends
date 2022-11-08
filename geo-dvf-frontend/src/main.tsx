import "@picocss/pico/css/pico.css";
import { render } from "preact";
import { App } from "./app";
import "./index.css";

render(<App />, document.getElementById("app") as HTMLElement);
