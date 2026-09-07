const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const outputDir = path.resolve(__dirname, '../assets/images/muscle-masks');
fs.mkdirSync(outputDir, { recursive: true });

const masks = {
  'front-shoulders': [
    'M145 205C151 190 174 182 198 187C218 191 232 210 231 230C228 256 209 278 184 286C165 280 149 258 145 234C143 223 143 213 145 205Z',
    'M385 205C379 190 356 182 332 187C312 191 298 210 299 230C302 256 321 278 346 286C365 280 381 258 385 234C387 223 387 213 385 205Z',
  ],
  'front-chest': [
    'M183 225C202 207 235 208 257 222L258 292C237 310 207 311 187 291C179 273 178 244 183 225Z',
    'M347 225C328 207 295 208 273 222L272 292C293 310 323 311 343 291C351 273 352 244 347 225Z',
  ],
  'front-biceps': [
    'M157 266C171 257 192 266 199 284L194 337C188 361 168 371 154 352L151 304C151 289 152 276 157 266Z',
    'M373 266C359 257 338 266 331 284L336 337C342 361 362 371 376 352L379 304C379 289 378 276 373 266Z',
  ],
  'front-core': [
    'M211 297C225 291 244 295 256 304L256 405C245 428 218 428 205 407L201 344C201 324 204 307 211 297Z',
    'M319 297C305 291 286 295 274 304L274 405C285 428 312 428 325 407L329 344C329 324 326 307 319 297Z',
  ],
  'front-quadriceps': [
    'M161 405C180 393 218 403 239 422L248 552C242 603 220 643 190 645C168 620 157 569 155 510Z',
    'M363 405C344 393 306 403 285 422L276 552C282 603 304 643 334 645C356 620 367 569 369 510Z',
  ],
  'front-calves': [
    'M181 631C195 619 220 624 232 644L230 789C225 840 211 882 190 889C178 866 177 817 180 766Z',
    'M343 631C329 619 304 624 292 644L294 789C299 840 313 882 334 889C346 866 347 817 344 766Z',
  ],
  'back-shoulders': [
    'M640 205C647 190 671 181 696 187C716 192 729 211 727 233C722 259 704 279 678 286C659 278 644 258 640 234C638 223 638 213 640 205Z',
    'M888 205C881 190 857 181 832 187C812 192 799 211 801 233C806 259 824 279 850 286C869 278 884 258 888 234C890 223 890 213 888 205Z',
  ],
  'back-back': [
    'M700 213C722 198 752 202 764 225L768 365C753 404 728 421 704 397L687 286C687 257 691 231 700 213Z',
    'M828 213C806 198 776 202 764 225L760 365C775 404 800 421 824 397L841 286C841 257 837 231 828 213Z',
  ],
  'back-triceps': [
    'M653 267C668 256 691 263 698 281L695 350C689 380 671 399 654 382L647 325C647 300 648 280 653 267Z',
    'M875 267C860 256 837 263 830 281L833 350C839 380 857 399 874 382L881 325C881 300 880 280 875 267Z',
  ],
  'back-glutes': [
    'M701 416C720 401 749 404 764 424L764 527C748 556 719 563 699 538C694 501 694 446 701 416Z',
    'M827 416C808 401 779 404 764 424L764 527C780 556 809 563 829 538C834 501 834 446 827 416Z',
  ],
  'back-hamstrings': [
    'M700 539C718 532 747 540 759 559L756 679C749 722 727 743 707 729C698 685 696 601 700 539Z',
    'M828 539C810 532 781 540 769 559L772 679C779 722 801 743 821 729C830 685 832 601 828 539Z',
  ],
  'back-calves': [
    'M706 696C720 686 744 692 752 711L752 838C746 872 728 896 708 899C700 864 701 762 706 696Z',
    'M822 696C808 686 784 692 776 711L776 838C782 872 800 896 820 899C828 864 827 762 822 696Z',
  ],
};

for (const [name, paths] of Object.entries(masks)) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><g fill="#35BDF5" fill-opacity="0.62">${paths.map((d) => `<path d="${d}"/>`).join('')}</g></svg>`;
  const svgPath = path.join(outputDir, `${name}.svg`);
  const pngPath = path.join(outputDir, `${name}.png`);
  fs.writeFileSync(svgPath, svg);
  execFileSync('convert', ['-background', 'none', svgPath, pngPath]);
  fs.unlinkSync(svgPath);
}

const baseImage = path.resolve(__dirname, '../assets/images/muscle-anatomy-final.png');
const mapDir = path.resolve(__dirname, '../assets/images/workout-maps');
fs.mkdirSync(mapDir, { recursive: true });

const workoutMaps = {
  push: ['front-shoulders', 'front-chest', 'back-shoulders', 'back-triceps'],
  pull: ['front-biceps', 'front-core', 'back-back'],
  leg: ['front-quadriceps', 'front-calves', 'back-glutes', 'back-hamstrings', 'back-calves'],
  upper: ['front-shoulders', 'front-chest', 'front-core', 'back-shoulders', 'back-back'],
  lower: ['front-quadriceps', 'front-calves', 'front-core', 'back-glutes', 'back-hamstrings', 'back-calves'],
  'push-core': ['front-shoulders', 'front-chest', 'front-core', 'back-shoulders', 'back-triceps'],
  'pull-triceps': ['front-biceps', 'back-back', 'back-triceps'],
  full: Object.keys(masks),
};

for (const [name, overlays] of Object.entries(workoutMaps)) {
  const args = [baseImage];
  for (const overlay of overlays) {
    args.push(path.join(outputDir, `${overlay}.png`), '-composite');
  }
  args.push(path.join(mapDir, `${name}.png`));
  execFileSync('magick', args);
}

console.log(`Created ${Object.keys(masks).length} transparent muscle masks and ${Object.keys(workoutMaps).length} ready workout maps`);