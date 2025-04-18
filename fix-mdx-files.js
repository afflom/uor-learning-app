const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Function to recursively find all MDX files
async function findMdxFiles(dir) {
  const files = await readdir(dir);
  const mdxFiles = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await stat(filePath);

    if (stats.isDirectory()) {
      const subDirMdxFiles = await findMdxFiles(filePath);
      mdxFiles.push(...subDirMdxFiles);
    } else if (file.endsWith('.mdx')) {
      mdxFiles.push(filePath);
    }
  }

  return mdxFiles;
}

// Extract title from MDX content
function extractTitle(content, filePath) {
  // Look for the first heading in the file
  const headingMatch = content.match(/^\s*#\s+(.+)$/m);
  if (headingMatch && headingMatch[1]) {
    return headingMatch[1].trim();
  }
  
  // If no heading is found, try to extract from the filename
  const filename = path.basename(filePath, '.mdx');
  return filename.charAt(0).toUpperCase() + filename.slice(1).replace(/([A-Z])/g, ' $1').trim();
}

// Function to fix MDX files with proper exports
async function fixMdxFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    
    // Extract title from the first heading
    const title = extractTitle(content, filePath);
    
    // Replace the import line with export metadata
    let updatedContent = content.replace(/import.*from.*metadata.*[\r\n]+/g, '');
    
    // Add metadata export at the top if missing
    if (!updatedContent.includes('export const metadata')) {
      updatedContent = `export const metadata = {\n  title: '${title}'\n};\n\n${updatedContent}`;
    }
    
    // Make sure there's a blank line after the metadata export 
    updatedContent = updatedContent.replace(/export const metadata = {[^}]+};\n(#)/g, 'export const metadata = {\n  title: \'' + title + '\'\n};\n\n$1');
    
    // Write back to file
    await writeFile(filePath, updatedContent);
    console.log(`Updated ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
    return false;
  }
}

async function main() {
  const pagesDir = path.join(__dirname, 'pages');
  const mdxFiles = await findMdxFiles(pagesDir);
  
  console.log(`Found ${mdxFiles.length} MDX files`);
  
  let updatedCount = 0;
  for (const file of mdxFiles) {
    const updated = await fixMdxFile(file);
    if (updated) {
      updatedCount++;
    }
  }
  
  console.log(`Updated ${updatedCount} files`);
}

main().catch(console.error);