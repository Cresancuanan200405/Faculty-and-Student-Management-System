
import React, { useState } from 'react';

const Faculty = () => {
	const [name, setName] = useState('');
	const handleSubmit = (e) => {
		e.preventDefault();
		alert(`Faculty name submitted: ${name}`);
		setName('');
	};
	return (
		<div>
			<h2>Faculty</h2>
			<form onSubmit={handleSubmit} style={{maxWidth: 400}}>
				<div className="mb-3">
					<label className="form-label">Faculty Name</label>
					<input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required />
				</div>
				<button type="submit" className="btn btn-primary">Submit</button>
			</form>
		</div>
	);
};

export default Faculty;
