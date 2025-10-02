
import React, { useState } from 'react';

const Courses = () => {
	const [course, setCourse] = useState('');
	const handleSubmit = (e) => {
		e.preventDefault();
		alert(`Course submitted: ${course}`);
		setCourse('');
	};
	return (
		<div>
			<h2>Courses</h2>
			<form onSubmit={handleSubmit} style={{maxWidth: 400}}>
				<div className="mb-3">
					<label className="form-label">Course Name</label>
					<input type="text" className="form-control" value={course} onChange={e => setCourse(e.target.value)} required />
				</div>
				<button type="submit" className="btn btn-primary">Submit</button>
			</form>
		</div>
	);
};

export default Courses;
