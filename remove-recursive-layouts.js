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

// Function to remove layout wrapper from MDX files
async function removeLayoutWrapper(filePath) {
  try {
    const content = await readFile(filePath, 'utf8');
    
    // Remove import Layout line
    let updatedContent = content.replace(/import Layout from .*?[\r\n]+/g, '');
    
    // Remove export default Layout wrapper
    updatedContent = updatedContent.replace(/export default \(\{ children \}\) => <Layout>\{children\}<\/Layout>[\r\n]*/g, '');
    
    // Write back to file if content changed
    if (content !== updatedContent) {
      await writeFile(filePath, updatedContent);
      console.log(`Updated ${filePath}`);
      return true;
    }
    
    return false;
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
    const updated = await removeLayoutWrapper(file);
    if (updated) {
      updatedCount++;
    }
  }
  
  console.log(`Updated ${updatedCount} files`);
}

main().catch(console.error);