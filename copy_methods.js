const fs = require('fs');

const frameworks = ['angular', 'react', 'vue'];

for (const fw of frameworks) {
    const engineFile = `c:/Projects/kritzel/apps/website/docs/${fw}/api-reference-engine.md`;
    const editorFile = `c:/Projects/kritzel/apps/website/docs/${fw}/api-reference-editor.md`;

    if (!fs.existsSync(engineFile) || !fs.existsSync(editorFile)) {
        console.log(`Missing files for ${fw}`);
        continue;
    }

    let engineContent = fs.readFileSync(engineFile, 'utf8');
    let isCRLF = engineContent.includes('\r\n');
    let nl = isCRLF ? '\r\n' : '\n';

    let methodsIndex = engineContent.indexOf(`## Methods`);
    if (methodsIndex === -1) {
        console.log(`No ## Methods in ${engineFile}`);
        continue;
    }

    let methodsContent = engineContent.substring(methodsIndex);

    let editorContent = fs.readFileSync(editorFile, 'utf8');
    
    // Replace text
    const targetText = "All methods are async and return Promises. The editor exposes all the same methods as the engine — see the [Engine Reference](api-reference-engine) for the full method list.";
    const repText = "All methods are async and return Promises. The editor exposes all the same methods as the engine.";
    
    if (editorContent.includes(targetText)) {
        editorContent = editorContent.replace(targetText, repText);
    } else {
        console.log(`Target text not found in ${editorFile}`);
    }

    // Ensure there is only one --- block and methods added correctly if not already present
    if (!editorContent.includes('## Methods')) {
        editorContent = editorContent.trimEnd() + nl + nl + '---' + nl + nl + methodsContent;
    }

    fs.writeFileSync(editorFile, editorContent);
    console.log(`Updated ${editorFile}`);
}
