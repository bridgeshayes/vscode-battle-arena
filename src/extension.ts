// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('VSCode Battle Arena is now active!');

	const provider = new BattleArenaViewProvider(context.extensionUri);
	
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('vscode-battle-arena-view', provider)
	);
}

class BattleArenaViewProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlContent(webviewView.webview);
	}

	private _getHtmlContent(webview: vscode.Webview) {
		const nonce = this._getNonce();

		// Helper function to create sprite URIs
		const createFrames = (character: string, folder: string, prefix: string, start: number, count: number) => {
			return Array.from({ length: count }, (_, i) => {
				const framePath = vscode.Uri.file(
					path.join(this._extensionUri.fsPath, 'media', 'PNG', character, folder, `${prefix}${i + start}.png`)
				);
				return webview.asWebviewUri(framePath).toString();
			});
		};

		// Create URIs for all animations
		const characterData = {
			Knight: {
				idle: createFrames('Knight', 'Idle', 'idle', 1, 12),
				run: createFrames('Knight', 'Run', 'run', 1, 8),
				attack: createFrames('Knight', 'Attack', 'attack', 0, 4)
			},
			Rogue: {
				idle: createFrames('Rogue', 'Idle', 'idle', 1, 18),
				run: createFrames('Rogue', 'Run', 'run', 1, 8),
				attack: createFrames('Rogue', 'Attack', 'Attack', 1, 7)
			},
			Mage: {
				idle: createFrames('Mage', 'Idle', 'idle', 1, 8),
				run: createFrames('Mage', 'Run', 'run', 1, 8),
				attack: createFrames('Mage', 'Attack', 'attack', 1, 8)
			}
		};

		// First, we need to create a URI for the arena background
		const arenaBackground = webview.asWebviewUri(vscode.Uri.file(
			path.join(this._extensionUri.fsPath, 'media', 'PNG', 'background', 'arena.webp')
		));

		return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data: https:; style-src 'unsafe-inline' https:; script-src 'nonce-${nonce}' https:; connect-src https:;">
			<title>Battle Arena</title>
			<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/dragula/3.7.3/dragula.min.css">
			<style>
				body {
					margin: 0;
					padding: 0;
					width: 100%;
					height: 100vh;
					background-color: var(--vscode-editor-background);
					overflow: hidden;
				}
				.battle-container {
					width: 100%;
					height: 100%;
					position: relative;
					image-rendering: pixelated;
					background: url('${arenaBackground}') no-repeat center center;
					background-size: cover;
				}
				.character {
					position: absolute;
					width: 64px;
					height: 64px;
					bottom: 31%;
					image-rendering: pixelated;
					transition: left 0.3s ease;
				}
				.knight {
					left: 20%;
				}
				.rogue {
					left: 60%;
				}
				.character img {
					width: 100%;
					height: 100%;
					image-rendering: pixelated;
					object-fit: contain;
				}
				.flip {
					transform: scaleX(-1);
				}
				.battle-container::before {
					content: '';
					position: absolute;
					bottom: 0;
					left: 0;
					right: 0;
					height: 35%;
					image-rendering: pixelated;
					pointer-events: none;
				}

				.character-select {
					position: absolute;
					top: 10px;
					left: 0;
					right: 0;
					display: flex;
					flex-direction: column;
					align-items: center;
					gap: 8px;
					z-index: 100;
					padding: 8px;
					background: rgba(0, 0, 0, 0.3);
					backdrop-filter: blur(2px);
				}
				.select-container {
					display: flex;
					flex-direction: column;
					align-items: center;
					width: 100%;
					max-width: 200px;
				}
				.select-container label {
					color: var(--vscode-foreground);
					margin-bottom: 4px;
					font-size: 11px;
					text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
					white-space: nowrap;
				}
				select {
					background: var(--vscode-dropdown-background);
					color: var(--vscode-dropdown-foreground);
					border: 1px solid var(--vscode-dropdown-border);
					padding: 2px 4px;
					border-radius: 2px;
					outline: none;
					width: 100%;
					min-width: 100px;
					max-width: 200px;
					font-size: 11px;
				}
				select:focus {
					border-color: var(--vscode-focusBorder);
				}
				.start-button {
					background: var(--vscode-button-background);
					color: var(--vscode-button-foreground);
					border: none;
					padding: 3px 8px;
					border-radius: 2px;
					cursor: pointer;
					margin-top: 8px;
					font-size: 11px;
					width: 100%;
					max-width: 200px;
				}
				.start-button:hover {
					background: var(--vscode-button-hoverBackground);
				}
				@media (min-width: 300px) {
					.character-select {
						flex-direction: row;
						flex-wrap: wrap;
						justify-content: center;
					}
					.select-container {
						width: auto;
					}
					select {
						width: auto;
					}
					.start-button {
						width: auto;
					}
				}

				.character.gu-mirror {
					position: fixed !important;
					margin: 0 !important;
					z-index: 9999 !important;
					opacity: 0.8;
					transform: rotate(5deg);
				}

				.character.gu-transit {
					opacity: 0.2;
				}

				.battle-container.drag-active {
					cursor: grab;
				}
			</style>
		</head>
		<body>
			<div class="battle-container" id="battleContainer">
				<div class="character fighter1" id="fighter1">
					<img id="fighter1Sprite" src="" alt="Fighter 1">
				</div>
				<div class="character fighter2" id="fighter2">
					<img id="fighter2Sprite" src="" alt="Fighter 2">
				</div>
				<div class="pixel-overlay"></div>
			</div>
			<script src="https://cdnjs.cloudflare.com/ajax/libs/dragula/3.7.3/dragula.min.js"></script>
			<script nonce="${nonce}">
				class Character {
					constructor(id, frames, startPosition) {
						this.element = document.getElementById(id);
						this.sprite = document.getElementById(id + 'Sprite');
						this.frames = frames;
						this.position = startPosition;
						this.currentState = 'idle';
						this.currentFrame = 0;
						this.isAttacking = false;
						this.facingRight = true;
						this.targetPosition = startPosition;
						this.timeouts = new Set();
						this.animationFrame = null;
						this.isBusy = false;
						this.isMoving = false;
						this.lastMoveTime = Date.now();
						this.lastStateChange = Date.now();
						this.stateTimeout = null;
						
						// Preload images
						this.preloadedImages = {};
						Object.keys(frames).forEach(state => {
							this.preloadedImages[state] = frames[state].map(src => {
								const img = new Image();
								img.src = src;
								return img;
							});
						});
					}

					clearAllTimeouts() {
						this.timeouts.forEach(timeout => clearTimeout(timeout));
						this.timeouts.clear();
						if (this.animationFrame) {
							clearTimeout(this.animationFrame);
							this.animationFrame = null;
						}
						if (this.stateTimeout) {
							clearTimeout(this.stateTimeout);
							this.stateTimeout = null;
						}
					}

					addTimeout(timeout) {
						this.timeouts.add(timeout);
						return timeout;
					}

					updateAnimation(state, force = false) {
						if (!force && this.currentState === state) return;
						this.currentState = state;
						this.currentFrame = 0;
						this.lastStateChange = Date.now();
						this.animate();
					}

					animate() {
						if (this.animationFrame) {
							clearTimeout(this.animationFrame);
							this.animationFrame = null;
						}

						const state = this.frames[this.currentState];
						if (!state || !state.length) return;

						const preloadedImage = this.preloadedImages[this.currentState][this.currentFrame];
						if (!preloadedImage) return;

						this.sprite.src = preloadedImage.src;
						this.currentFrame = (this.currentFrame + 1) % state.length;
						
						const duration = this.getAnimationDuration() / state.length;
						this.animationFrame = this.addTimeout(setTimeout(() => {
							if (!this.isBusy || this.currentState === 'idle') {
								this.animate();
							}
						}, duration));

						// Failsafe: If we've been in the same state too long, force a reset
						if (this.stateTimeout) clearTimeout(this.stateTimeout);
						this.stateTimeout = setTimeout(() => this.checkStateTimeout(), this.getAnimationDuration() * 2);
					}

					checkStateTimeout() {
						const now = Date.now();
						const timeInState = now - this.lastStateChange;
						
						// If we've been in the same state for too long (except idle)
						if (this.currentState !== 'idle' && timeInState > 2000) {
							console.log(this.element.id + ' stuck in ' + this.currentState + ' state, resetting...');
							this.reset();
							this.forceMove();
						}
					}

					getAnimationDuration() {
						switch(this.currentState) {
							case 'idle': return 800;
							case 'run': return 800;
							case 'attack': return 500;
							default: return 800;
						}
					}

					moveTowards(target) {
						if (Math.abs(this.position - target) < 1) {
							this.position = target;
							this.isMoving = false;
							this.updateAnimation('idle');
							return true;
						}

						if (!this.isMoving) {
							this.isMoving = true;
							this.updateAnimation('run', true);
						}

						const direction = target > this.position ? 1 : -1;
						this.facingRight = direction > 0;
						this.element.classList.toggle('flip', !this.facingRight);
						
						// Very slow, smooth movement
						this.position += direction * 0.2;
						this.element.style.left = this.position + '%';
						this.lastMoveTime = Date.now();
						return false;
					}

					attack() {
						if (this.isAttacking || this.isBusy) return;
						
						this.clearAllTimeouts();
						this.isAttacking = true;
						this.isBusy = true;
						this.isMoving = false;
						this.updateAnimation('attack', true);
						
						// Complete attack animation
						this.addTimeout(setTimeout(() => {
							this.isAttacking = false;
							this.isBusy = false;
							this.updateAnimation('idle', true);
						}, 500));
					}

					reset() {
						this.clearAllTimeouts();
						this.isAttacking = false;
						this.isBusy = false;
						this.isMoving = false;
						this.updateAnimation('idle', true);
						this.animate();
					}

					forceMove() {
						this.clearAllTimeouts();
						this.isAttacking = false;
						this.isBusy = false;
						this.isMoving = false;
						// Move a short distance away
						const direction = Math.random() < 0.5 ? -1 : 1;
						const distance = 10 + Math.random() * 10;
						this.targetPosition = Math.max(10, Math.min(90, this.position + (direction * distance)));
						this.lastMoveTime = Date.now();
						this.updateAnimation('run', true);
					}
				}

				const characterData = ${JSON.stringify(characterData)};
				let currentBattle = null;

				function startBattle() {
					if (currentBattle) {
						currentBattle.cleanup();
					}

					// Clear existing sprites
					document.getElementById('fighter1Sprite').src = '';
					document.getElementById('fighter2Sprite').src = '';
					
					// Reset positions and clear any leftover classes
					const fighter1Element = document.getElementById('fighter1');
					const fighter2Element = document.getElementById('fighter2');
					fighter1Element.className = 'character fighter1';
					fighter2Element.className = 'character fighter2';
					fighter1Element.style.left = '20%';
					fighter2Element.style.left = '80%';

					// Small delay to ensure cleanup is complete
					setTimeout(() => {
						// Fixed characters: Knight and Mage
						const fighter1 = new Character('fighter1', characterData['Knight'], 20);
						const fighter2 = new Character('fighter2', characterData['Mage'], 60);

						let updateFrame;
						let lastFightTime = 0;
						const FIGHT_COOLDOWN = 5000;
						const FIGHT_DURATION = 3000;
						let isFighting = false;

						function cleanup() {
							if (updateFrame) {
								cancelAnimationFrame(updateFrame);
								updateFrame = null;
							}
							fighter1.clearAllTimeouts();
							fighter2.clearAllTimeouts();
							// Clear sprites on cleanup
							document.getElementById('fighter1Sprite').src = '';
							document.getElementById('fighter2Sprite').src = '';
							drake.destroy();
						}

						function getNewRandomPosition(character) {
							const minDistance = 20;
							const currentPos = character.position;
							let newPos;
							do {
								newPos = Math.random() * 70 + 15;
							} while (Math.abs(newPos - currentPos) < minDistance);
							return newPos;
						}

						function startFight() {
							isFighting = true;
							lastFightTime = Date.now();

							fighter1.facingRight = fighter1.position < fighter2.position;
							fighter2.facingRight = fighter2.position < fighter1.position;
							fighter1.element.classList.toggle('flip', !fighter1.facingRight);
							fighter2.element.classList.toggle('flip', !fighter2.facingRight);

							setTimeout(() => fighter1.attack(), 200);
							setTimeout(() => fighter2.attack(), 700);
							setTimeout(() => fighter1.attack(), 1200);
							setTimeout(() => fighter2.attack(), 1700);
							setTimeout(() => fighter1.attack(), 2200);
							setTimeout(() => fighter2.attack(), 2700);

							setTimeout(() => {
								isFighting = false;
								fighter1.targetPosition = getNewRandomPosition(fighter1);
								fighter2.targetPosition = getNewRandomPosition(fighter2);
								fighter1.forceMove();
								fighter2.forceMove();
							}, FIGHT_DURATION);
						}

						function updateBattle() {
							const now = Date.now();
							const timeSinceLastFight = now - lastFightTime;

							if (!isFighting) {
								[fighter1, fighter2].forEach(character => {
									if (!character.isBusy && !character.isMoving) {
										character.targetPosition = getNewRandomPosition(character);
										character.forceMove();
									}
								});

								if (timeSinceLastFight > FIGHT_COOLDOWN && 
									Math.abs(fighter1.position - fighter2.position) < 20 &&
									!fighter1.isBusy && !fighter2.isBusy) {
									startFight();
								}
							}

							if (!fighter1.isBusy) fighter1.moveTowards(fighter1.targetPosition);
							if (!fighter2.isBusy) fighter2.moveTowards(fighter2.targetPosition);
							
							updateFrame = requestAnimationFrame(updateBattle);
						}

						// Initialize dragula
						const drake = dragula([document.getElementById('battleContainer')], {
							moves: function(el, container, handle) {
								return el.classList.contains('character');
							},
							accepts: function(el, target, source, sibling) {
								return true;
							},
							direction: 'horizontal'
						});

						drake.on('drag', function(el) {
							document.getElementById('battleContainer').classList.add('drag-active');
							// Pause the battle animation while dragging
							if (currentBattle) {
								currentBattle.pause();
							}
						});

						drake.on('dragend', function(el) {
							document.getElementById('battleContainer').classList.remove('drag-active');
							// Update character position based on new position
							const rect = el.getBoundingClientRect();
							const containerRect = document.getElementById('battleContainer').getBoundingClientRect();
							const position = ((rect.left - containerRect.left) / containerRect.width) * 100;
							
							const character = el.id === 'fighter1' ? fighter1 : fighter2;
							character.position = Math.max(10, Math.min(90, position));
							character.targetPosition = character.position;
							el.style.left = character.position + '%';

							// Resume the battle
							if (currentBattle) {
								currentBattle.resume();
							}
						});

						cleanup();
						fighter1.reset();
						fighter2.reset();
						fighter1.position = 20;
						fighter2.position = 80;
						fighter1.targetPosition = fighter1.position;
						fighter2.targetPosition = fighter2.position;
						fighter1.element.style.left = fighter1.position + '%';
						fighter2.element.style.left = fighter2.position + '%';

						updateFrame = requestAnimationFrame(updateBattle);

						// Add pause/resume functionality
						let isPaused = false;
						let lastRAF = null;

						function pause() {
							isPaused = true;
							if (updateFrame) {
								cancelAnimationFrame(updateFrame);
								updateFrame = null;
							}
						}

						function resume() {
							if (isPaused) {
								isPaused = false;
								updateFrame = requestAnimationFrame(updateBattle);
							}
						}

						currentBattle = { cleanup, pause, resume };
					}, 50); // Small delay to ensure clean state
				}

				// Start battle immediately when the page loads
				window.addEventListener('load', startBattle);
			</script>
		</body>
		</html>`;
	}

	private _getNonce() {
		let text = '';
		const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		for (let i = 0; i < 32; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}



// <div class="character-select">
// 				<div class="select-container">
// 					<label for="character1">Left Character</label>
// 					<select id="character1">
// 						<option value="Knight">Knight</option>
// 						<option value="Rogue">Rogue</option>
// 						<option value="Mage">Mage</option>
// 					</select>
// 				</div>
// 				<div class="select-container">
// 					<label for="character2">Right Character</label>
// 					<select id="character2">
// 						<option value="Rogue">Rogue</option>
// 						<option value="Knight">Knight</option>
// 						<option value="Mage">Mage</option>
// 					</select>
// 				</div>
// 				<button class="start-button" id="startButton">Start Battle</button>
// 			</div>