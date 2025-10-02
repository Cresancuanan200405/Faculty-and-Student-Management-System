
import React, { useState } from 'react';

const Settings = () => {
	const [setting, setSetting] = useState('');
	const handleSubmit = (e) => {
		e.preventDefault();
		alert(`Setting submitted: ${setting}`);
		setSetting('');
	};
	return (
		<div>
			<h2>Settings</h2>
			<form onSubmit={handleSubmit} style={{maxWidth: 400}}>
				<div className="mb-3">
					<label className="form-label">Setting Name</label>
					<input type="text" className="form-control" value={setting} onChange={e => setSetting(e.target.value)} required />
				</div>
				<button type="submit" className="btn btn-primary">Submit</button>
			</form>
		</div>
	);
};

export default Settings;
