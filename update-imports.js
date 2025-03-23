import { readdir, readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function* getFiles(dir) {
    const dirents = await readdir(dir, { withFileTypes: true });
    for (const dirent of dirents) {
        const res = join(dir, dirent.name);
        if (dirent.isDirectory()) {
            yield* getFiles(res);
        } else if (dirent.name.endsWith('.js')) {
            yield res;
        }
    }
}

async function updateImports(filePath) {
    const content = await readFile(filePath, 'utf8');
    const updatedContent = content.replace(
        /from ['"]([^'"]+)['"];/g,
        (match, importPath) => {
            if (importPath.startsWith('.') && !importPath.endsWith('.js') && !importPath.endsWith('.css')) {
                return `from '${importPath}.js';`;
            }
            return match;
        }
    );
    await writeFile(filePath, updatedContent);
}

async function main() {
    const srcDir = join(__dirname, 'src');
    for await (const file of getFiles(srcDir)) {
        console.log(`Updating imports in ${file}`);
        await updateImports(file);
    }
}

main().catch(console.error); 