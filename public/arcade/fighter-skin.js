// Bounds are in isolated atlas pixels. The RGB shifts match each face's
// midtones while keeping the hand's own highlights and shadows.
const grades = [
  [ // Sam Altman
    { bounds: [42, 264, 135, 337], shift: [-8, -3, 10], outline: 'M43 284 Q58 261 75 268 L94 290 L121 288 L136 300 L135 322 L111 339 L73 337 L41 302Z' },
    { bounds: [230, 184, 286, 263], shift: [-5, -1, 10], outline: 'M232 216 L232 198 L249 183 L280 189 L290 219 L274 248 L259 264 L241 264 L235 253 L238 238Z' },
    { bounds: [111, 126, 182, 166], shift: [-2, 0, 8], blendTop: 18, outline: 'M112 125 Q133 128 149 138 L174 142 L177 155 Q169 167 148 162 Q125 157 114 146Z' },
  ],
  [ // Dario Amodei
    { bounds: [56, 286, 128, 347], shift: [-5, -1, 6], outline: 'M57 314 Q62 292 79 289 L94 298 L117 296 L129 308 L128 329 L105 346 L73 347 L56 330Z' },
    { bounds: [216, 187, 276, 265], shift: [0, 0, 4], outline: 'M223 223 L218 203 L232 187 L256 188 L277 203 L277 229 L249 264 L232 263 L226 253 L228 240Z' },
  ],
  [ // Elon Musk
    { bounds: [71, 293, 140, 347], shift: [-3, -3, 14], outline: 'M72 312 Q76 292 102 295 L127 300 L142 312 L137 329 L118 348 L89 348 L73 331Z' },
    { bounds: [236, 191, 297, 260], shift: [-2, -2, 14], outline: 'M241 225 L238 201 L253 190 L286 192 L298 208 L298 237 L274 259 L254 260 L244 248Z' },
    { bounds: [113, 125, 187, 163], shift: [1, -1, 8], blendTop: 18, outline: 'M113 123 L133 127 L157 134 L184 139 L179 156 L168 152 L148 145 L128 137 L116 132Z' },
  ],
  [ // Larry Ellison
    { bounds: [72, 296, 138, 352], shift: [1, -2, 3], outline: 'M75 324 Q81 307 100 300 L125 303 L139 316 L139 338 L109 352 L79 347Z' },
    { bounds: [243, 198, 302, 273], shift: [2, -1, 3], outline: 'M252 242 L243 221 L250 203 L279 198 L303 215 L303 238 L276 267 L265 263 L258 254Z' },
  ],
  [ // Larry Page
    { bounds: [74, 270, 139, 326], shift: [-9, -2, 2] },
    { bounds: [245, 174, 302, 238], shift: [-6, 2, 4] },
  ],
  [ // Jeff Bezos
    {
      bounds: [14, 180, 137, 324], shift: [-5, -8, 5],
      outline: 'M14 219 L33 182 L83 184 L94 203 L81 220 L76 232 L89 268 L96 274 L124 275 L137 291 L137 313 L112 324 L80 324 L61 293 L32 269 L14 239Z',
    },
    {
      bounds: [197, 173, 306, 260], shift: [1, -3, 10],
      outline: 'M198 224 L204 211 L221 199 L232 201 L234 215 L245 209 L247 188 L264 173 L289 174 L306 193 L306 223 L271 242 L244 257 L197 260Z',
    },
    { bounds: [113, 103, 178, 150], shift: [0, -1, 5], blendTop: 19, outline: 'M113 99 L132 104 L152 110 L173 113 L173 123 L166 134 L162 151 L155 139 L140 129 L124 123 L111 108Z' },
  ],
  [ // Warren Buffett
    { bounds: [82, 284, 146, 339], shift: [-3, -1, 6], outline: 'M84 319 Q93 295 111 289 L133 290 L147 310 L146 330 L117 342 L94 336Z' },
    { bounds: [256, 178, 314, 245], shift: [1, -1, 6], outline: 'M258 218 L262 196 L279 179 L304 185 L315 201 L315 225 L287 244 L268 245 L261 232Z' },
  ],
];

export function matchFighterSkin(source, index) {
  const regions = grades[index];
  if (!regions) return source;

  const { width, height } = source;
  const graded = document.createElement('canvas');
  graded.width = width;
  graded.height = height;
  const context = graded.getContext('2d', { willReadFrequently: true });
  context.drawImage(source, 0, 0);
  const pixels = context.getImageData(0, 0, width, height);
  const { data } = pixels;

  for (const { bounds, shift, outline, blendTop = 4 } of regions) {
    const [left, top, right, bottom] = bounds;
    const shape = outline && new Path2D(outline);
    for (let y = top; y < Math.min(height, bottom); y++) {
      for (let x = left; x < Math.min(width, right); x++) {
        const i = (y * width + x) * 4;
        if (data[i + 3] === 0 || (shape && !context.isPointInPath(shape, x + .5, y + .5))) continue;
        const red = data[i], green = data[i + 1], blue = data[i + 2];
        // Fade out across dark ink, cool fabric, and the neckline transition.
        const skin = Math.min((red - 94) / 42, (red - green - 18) / 24, (green - blue + 4) / 16);
        const edge = Math.min((x - left + 1) / 4, (right - x) / 4, (y - top + 1) / blendTop, (bottom - y) / 4);
        const amount = Math.max(0, Math.min(1, skin, edge));
        data[i] = red + shift[0] * amount;
        data[i + 1] = green + shift[1] * amount;
        data[i + 2] = blue + shift[2] * amount;
      }
    }
  }
  context.putImageData(pixels, 0, 0);
  return graded;
}
