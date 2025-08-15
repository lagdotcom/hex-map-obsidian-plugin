import { App, Modal, Setting } from "obsidian";

export default class TextModal extends Modal {
	constructor(
		app: App,
		title: string,
		name: string,
		onSubmit: (value: string) => void
	) {
		super(app);
		this.setTitle(title);

		let value = "";
		new Setting(this.contentEl)
			.setName(name)
			.addText((el) => el.onChange((newValue) => (value = newValue)));

		new Setting(this.contentEl).addButton((el) =>
			el
				.setButtonText("Submit")
				.setCta()
				.onClick(() => {
					this.close();
					onSubmit(value);
				})
		);
	}
}
