class CommitWatch {
	private callbacks = new Set<() => void>();

	commit() {
		for (const func of this.callbacks) {
			func();
		}
	}

	attach(callback: () => void) {
		this.callbacks.add(callback);

		return () => {
			this.callbacks.delete(callback);
		};
	}

	detach(callback: () => void) {
		this.callbacks.delete(callback);
	}
}

const commitWatch = new CommitWatch();

export default commitWatch;
