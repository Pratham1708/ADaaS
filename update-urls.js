const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    'frontend/pages/workspace/[dataset_id].tsx',
    'frontend/pages/timeseries-dashboard/[job_id].tsx',
    'frontend/pages/mortality-dashboard/[dataset_id].tsx',
    'frontend/pages/glm-dashboard/[job_id].tsx',
    'frontend/pages/dashboard/workspace/[dataset_id].tsx',
    'frontend/pages/dashboard/timeseries/[dataset_id].tsx',
    'frontend/pages/dashboard/survival/[dataset_id].tsx',
    'frontend/pages/dashboard/summary/[dataset_id].tsx',
    'frontend/pages/dashboard/mortality/[dataset_id].tsx',
    'frontend/pages/dashboard/ml-survival/[dataset_id].tsx',
    'frontend/pages/dashboard/glm/[dataset_id].tsx',
    'frontend/pages/dashboard/ai-insights/[dataset_id].tsx',
    'frontend/pages/analysis/[job_id].tsx'
];

let count = 0;
filesToUpdate.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        const newContent = content.replace(
            /process\.env\.NEXT_PUBLIC_API_URL \|\| 'http:\/\/localhost:8000'/g,
            "process.env.NEXT_PUBLIC_API_URL || 'https://adaas-backend.onrender.com'"
        );

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`✅ Updated: ${file}`);
            count++;
        } else {
            console.log(`⏭️  Skipped (no change): ${file}`);
        }
    } else {
        console.log(`❌ Not found: ${file}`);
    }
});

console.log(`\n✨ Done! Updated ${count} files.`);
