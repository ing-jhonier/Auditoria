import readline from "node:readline";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { db } from "./db/index.js";
import { createPasswordHash, passwordPolicy } from "./passwords.js";

function hidden(prompt) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function")
    throw new Error(
      "Ejecuta este comando desde una terminal interactiva para no mostrar la contraseña.",
    );
  return new Promise((resolve, reject) => {
    readline.emitKeypressEvents(stdin);
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    let value = "";
    const done = (result, error) => {
      stdin.off("keypress", onKey);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
      if (error) reject(error);
      else resolve(result);
    };
    const onKey = (character, key = {}) => {
      if (key.ctrl && key.name === "c")
        return done("", new Error("Operación cancelada."));
      if (key.name === "return" || key.name === "enter") return done(value);
      if (key.name === "backspace") {
        value = value.slice(0, -1);
        return;
      }
      if (character && !key.ctrl && !key.meta) value += character;
    };
    stdin.on("keypress", onKey);
  });
}

const rl = createInterface({ input: stdin, output: stdout });
try {
  const username = (await rl.question("Usuario/correo: ")).trim();
  const displayName = (await rl.question("Nombre para mostrar: ")).trim();
  stdout.write("Rol: 1) Bodega y logística  2) Gerencia\n");
  const roleChoice = (await rl.question("Selecciona 1 o 2: ")).trim();
  const role =
    roleChoice === "1"
      ? "Bodega y logística"
      : roleChoice === "2"
        ? "Gerencia"
        : "";
  rl.close();
  if (
    !username ||
    username.length > 254 ||
    !displayName ||
    displayName.length > 120 ||
    !role
  )
    throw new Error("Usuario, nombre o rol inválido.");
  const password = await hidden(
    "Contraseña (mín. 12, mayúscula, minúscula, número y símbolo): ",
  );
  const confirmation = await hidden("Confirma la contraseña: ");
  if (password !== confirmation)
    throw new Error("Las contraseñas no coinciden.");
  if (!passwordPolicy(password))
    throw new Error("La contraseña no cumple la política mínima.");
  const stored = createPasswordHash(password);
  db.prepare(
    "INSERT INTO users(username,display_name,role,password_algorithm,password_hash,created_at) VALUES(?,?,?,'sha256',?,?)",
  ).run(username, displayName, role, stored.hash, new Date().toISOString());
  console.log(`Cuenta creada para ${username} con rol ${role}.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (!rl.closed) rl.close();
  db.close();
}
