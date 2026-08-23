const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const toggleUI = `                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-3 cursor-pointer p-3 bg-[#0f172a] border border-gray-700 rounded-lg hover:border-gray-500 transition-all">
                        <input
                          type="checkbox"
                          checked={settings.generateImageAndAnimationPrompts}
                          onChange={(e) => setSettings({ ...settings, generateImageAndAnimationPrompts: e.target.checked })}
                          className="w-5 h-5 accent-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-300">
                          Generate separate Image + Animation prompts (For Luma / Pika)
                        </span>
                      </label>
                    </div>`;

code = code.replace(/<\/select>\s*<\/div>\s*<\/div>\s*<\/div>/, "</select>\n                    </div>\n" + toggleUI + "\n                  </div>\n                </div>");

fs.writeFileSync('App.tsx', code);
console.log("Added toggle UI");
