const icons = 
{
	bucket:
		`<svg enable-background="new 0 0 24 24" fill="none" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" gradientTransform="rotate(90)"><stop offset="15%" stop-color="##colour##"/><stop offset="95%" stop-color="##colour2##"/></linearGradient></defs><path d="m20.5 12.7-.3-.4.1-.1c.5-.3.8-.7.8-1.3.1-.5-.1-1-.5-1.4l-6.3-6.3c-1.2-1.2-3.1-1.2-4.2 0-1-1.4-1.8-2.3-2.7-2.5-.6-.3-1.3-.2-1.9.2-1.3.9-1.2 2.9.6 6.4l-4.1 4.1c-1.2 1.2-1.2 3.1 0 4.3l5 5c.6.6 1.3.9 2.1.9s1.6-.3 2.1-.9l7.4-7.4c.1-.1.3-.2.4-.3l.1-.1c-.7.9-2.8 3.9-2.8 5.5 0 2 1.6 3.5 3.5 3.5s3.5-1.6 3.5-3.5c.1-1.7-2.3-5-2.8-5.7z" fill="#fff"/><g fill="none" stroke="#404040" stroke-miterlimit="16.0535" stroke-width="1.6054"><path d="m13.2 4.4 6.3 6.3c.1.1.1.2 0 .2l-1.2.7c-.3.2-.5.4-.8.6l-7.4 7.4c-.6.6-1.5.6-2.1 0l-5-5c-.6-.6-.6-1.5 0-2.1l8.1-8.1c.6-.6 1.6-.6 2.1 0z" fill="none"/><path d="m11.6 9.8s-3.4-8.8-5.2-7.6c-1 .7 1.6 5.4 1.6 5.4" fill="none"/><circle cx="11.6" cy="9.8" fill="#404040" r=".7"/></g><path d="m17.1 18.4c0-1.5 2.8-5.2 2.8-5.2s2.8 3.7 2.8 5.2-1.2 2.8-2.8 2.8-2.8-1.2-2.8-2.8z" fill="url('#g')"/></svg>`,
	filldelete:
		`<svg enable-background="new 0 0 24 24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="m21.6 18.5 1.1-1.1c.3-.3.4-.6.4-1s-.1-.7-.4-1l-.3-.3c-.5-.5-1.4-.5-2 0l-1.1 1.1-1.1-1.1c-.3-.3-.8-.4-1.2-.4l1.5-1.5c.1-.1.3-.2.4-.3l1.2-.7.1-.1c.5-.3.8-.7.8-1.3.1-.5-.1-1-.5-1.4l-6.3-6.3c-1.2-1.2-3.1-1.2-4.2 0-1-1.4-1.8-2.3-2.7-2.5-.5-.2-1.2-.1-1.8.3-1.3.9-1.2 2.9.6 6.4l-4.1 4.1c-1.2 1.2-1.2 3.1 0 4.3l5 5c.6.6 1.3.9 2.1.9s1.6-.3 2.1-.9l4.4-4.4v.2c0 .4.1.7.4 1l1.1 1.1-1.1 1c-.3.3-.4.6-.4 1s.1.7.4 1l.3.3c.5.5 1.4.5 2 0l1.1-1.1 1.1 1.1c.3.3.6.4 1 .4s.7-.1 1-.4l.3-.3c.3-.3.4-.6.4-1s-.1-.7-.4-1z" fill="#fff"/><g stroke="#404040" stroke-miterlimit="16.0535" stroke-width="1.6054"><path d="m13.2 4.4 6.3 6.3c.1.1.1.2 0 .2l-1.2.7c-.3.2-.5.4-.8.6l-7.4 7.4c-.6.6-1.5.6-2.1 0l-5-5c-.6-.6-.6-1.5 0-2.1l8.1-8.1c.6-.6 1.6-.6 2.1 0z" fill="none"/><path d="m11.6 9.8s-3.4-8.8-5.2-7.6c-1 .7 1.6 5.4 1.6 5.4" fill="none"/><circle cx="11.6" cy="9.8" fill="#404040" r=".7"/></g><path d="m22.1 16.1-.3-.3c-.2-.2-.6-.2-.9 0l-1.1 1.1c-.2.2-.6.2-.9 0l-1.1-1.1c-.2-.2-.6-.2-.9 0l-.3.3c-.2.2-.2.6 0 .9l1.1 1.1c.2.2.2.6 0 .9l-1.1 1.1c-.2.2-.2.6 0 .9l.3.3c.2.2.6.2.9 0l1.1-1.1c.2-.2.6-.2.9 0l1.1 1.1c.2.2.6.2.9 0l.3-.3c.2-.2.2-.6 0-.9l-1.1-1.1c-.2-.2-.2-.6 0-.9l1.1-1.1c.3-.3.3-.7 0-.9z" fill="#404040"/></svg>`,		
	eraser:
		`<svg enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="m7 20.8h-3.6c-1.2 0-2.2-.7-2.7-1.8s-.2-2.3.6-3.1l11.8-11.8c1-1 2.4-1.6 3.8-1.6h3.6c1.2 0 2.2.7 2.7 1.8s.2 2.3-.6 3.1l-11.8 11.8c-1 1-2.4 1.6-3.8 1.6zm9.9-16.8c-1 0-2 .4-2.8 1.1l-11.7 11.8c-.4.4-.5 1-.3 1.5s.7.9 1.3.9h3.6c1 0 2-.4 2.8-1.1l11.7-11.9c.4-.4.5-1 .3-1.5-.2-.5-.7-.8-1.3-.8z" fill="#fff"/><path d="m20.8 19.8h-11.4l2.7-2.7c.3-.3.6-.4 1-.4h7.7c.8 0 1.4.6 1.4 1.4v.3c0 .8-.6 1.4-1.4 1.4zm-7.8-1.5h7.7v-.1h-7.6z" fill="#fff"/><path d="m21.4 6.3-11.7 11.8c-.7.7-1.7 1.1-2.7 1.1h-3.6c-1.2 0-1.8-1.4-.9-2.3l11.7-11.7c.7-.8 1.7-1.2 2.7-1.2h3.6c1.2 0 1.8 1.5.9 2.3z" fill="none" stroke="#404040" stroke-miterlimit="16.0535" stroke-width="1.6054"/><path d="m6.5 13.2h8.1" fill="none" stroke="#404040" stroke-miterlimit="16.0535" stroke-width="1.6054"/><path d="m21.5 18.4c0 .4-.3.7-.7.7h-9.6l1.4-1.4c.1-.1.3-.2.5-.2h7.7c.4 0 .7.3.7.7z" fill="#404040"/></svg>`,
	eyedropper:
		`<svg enable-background="new 0 0 29.8 29.9" height="24" viewBox="0 0 29.8 29.9" width="24" xmlns="http://www.w3.org/2000/svg"><path d="m3.8 29.9c-.7 0-1.2-.3-1.7-.7l-1.4-1.4c-.5-.5-2-2 1.6-7.2l.2-.3 7.4-7.3-.8-.8c-.6-.6-.9-1.3-.9-2.1s.3-1.5.9-2.1l2.8-2.8c1.2-1.2 3.1-1.2 4.2 0l.7.7 5-5c1.1-1.1 3.1-1.1 4.2 0l2.8 2.8c.6.6.9 1.3.9 2.1s-.3 1.5-.9 2.1l-5 5.1.8.8c.6.6.9 1.3.9 2.1s-.3 1.5-.9 2.1l-2.9 2.7c-.5.5-1.3.8-2.1.8s-1.5-.3-2.1-.9l-.6-.6-7.5 7.5-.2.1c-2.6 1.7-4.3 2.3-5.4 2.3zm15.2-12.1s0 .1 0 0z" fill="#fff"/><g fill="none" stroke="#404040" stroke-miterlimit="20" stroke-width="2"><path d="m3.6 27.8c-.6-.6-.6-.6-1.4-1.4s1.8-4.7 1.8-4.7l8.7-8.7 4.3 4.3-8.8 8.7s-4 2.4-4.6 1.8z"/><path d="m21.8 12.2 5.7-5.7c.4-.4.4-1 0-1.4l-2.8-2.8c-.4-.4-1-.4-1.4 0l-5.7 5.7c-.4.4-1 .4-1.4 0l-1.4-1.4c-.4-.4-1-.4-1.4 0l-2.8 2.8c-.4.4-.4 1 0 1.4l8.5 8.5c.4.4 1 .4 1.4 0l2.8-2.6c.4-.4.4-1 0-1.4l-1.4-1.4c-.5-.5-.5-1.3-.1-1.7z"/></g></svg>`,
	brush:
		`<svg enable-background="new 0 0 17.9 16.2" fill="none" height="24" viewBox="0 0 17.9 16.2" width="25" xmlns="http://www.w3.org/2000/svg"><path d="m7.9 16.2c-.3 0-.5-.1-.7-.3l-6.9-7.4c-.3-.3-.4-.8-.2-1.2.2-.3.7-.5 1.1-.5 0 0 1.6.2 2.8-.6 1.3-1 2.5-2.2 2.7-2.3 0 0 0 0 .1-.1-.1-.2 0-.4.2-.6l1.4-1.4c.6-.6 1.6-.6 2.1 0l1 1 2.5-2.4c.6-.6 1.6-.6 2.1 0l1.4 1.4c.6.6.6 1.6 0 2.1l-2.4 2.4 1 1c.3.3.4.7.4 1.1s-.2.8-.4 1.1l-1.4 1.5c-.1.1-.3.3-.5.3-.1.2-.4.5-.9.9-1 1.1-1.8 1.8-2.6 2.4-1 .8-1.9 1.2-2.2 1.4 0 0 0 0-.1 0-.2.2-.3.2-.5.2zm6.8-10.2c0 .1 0 .1 0 0zm-7.8-.8s0 .1 0 0z" fill="#fff"/><g fill="none" stroke="#404040"><path d="m1.4 8.2 6.4 6.9c.1.1.2.1.2 0 .4-.2 1.7-.9 3-2 1.4-1.3 2.2-2.2 2.5-2.5.1-.1.1-.2 0-.3l-5.9-5.8c-.1-.1-.2-.1-.3 0-.4.4-1.4 1.4-2.8 2.5-1.2.9-2.3.9-3 .9-.2 0-.3.2-.1.3z" fill="none" stroke="##colour##"/><path d="m14 6 2.8-2.8c.2-.2.2-.5 0-.7l-1.4-1.4c-.2-.2-.5-.2-.7 0l-2.8 2.8c-.2.2-.5.2-.7 0l-1.4-1.3c-.2-.2-.5-.2-.7 0l-1.4 1.3c-.2.2-.2.5 0 .7l5.6 5.6c.2.2.5.2.7 0l1.4-1.4c.2-.2.2-.5 0-.7l-1.4-1.3c-.2-.2-.2-.6 0-.8z" fill="none"/><path d="m4.5 7s-1 1.9 1.8 3 5.1 1.7 6.3 1.6-1.9 1.9-2.5 2.3-2.2 1.4-2.2 1.4l-6.9-7.5z" fill="##colour##" stroke="##colour##"/></g></svg>`,
	random:
		`<svg enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><g fill="#fff"><path d="m21.6 9.6-7.2-7.2c-.6-.6-1.5-1-2.4-1-.9 0-1.8.4-2.4 1l-7.2 7.2c-.6.6-1 1.5-1 2.4s.4 1.8 1 2.4l7.2 7.2c.6.6 1.5 1 2.4 1s1.8-.4 2.4-1l7.2-7.2c1.4-1.3 1.4-3.5 0-4.8z"/><g stroke="#404040" stroke-miterlimit="16.0535" stroke-width="1.6054"><path d="m13.3 3.5 7.2 7.2c.7.7.7 1.9 0 2.7l-7.2 7.2c-.7.7-1.9.7-2.7 0l-7.2-7.2c-.7-.7-.7-1.9 0-2.7l7.2-7.2c.8-.8 2-.8 2.7 0z"/><circle cx="12" cy="12" r=".6"/><circle cx="12" cy="7.7" r=".6"/><circle cx="12" cy="16.3" r=".6"/><circle cx="16.3" cy="12" r=".6"/><circle cx="7.7" cy="12" r=".6"/></g></g></svg>`,
	
};

export function getIcon (name: string, colour: string="#404040", colour2: string=null)
{
	if (colour2 === null) colour2 = colour;
	
	// console.log("SVG ", icons[name].
	// replaceAll("##colour##",colour).
	// replaceAll("##colour2##",colour2));
	
	return icons[name].
		replaceAll("##colour##",colour).
		replaceAll("##colour2##",colour2);
}
export function getURLfromSVG(svg: string) { return URL.createObjectURL(new Blob([svg], {type: "image/svg+xml"})); }
export function getCSSfromURL(url: string) { return `url('${url}')`; }
export function getCSSfromSVG(svg: string) { return `url('${getURLfromSVG(svg)}')`; }

export function getIconURL(name: string, colour: string="#404040", colour2: string=null) { return getURLfromSVG(getIcon(name,colour,colour2)); }
export function getIconCSS(name: string, colour: string="#404040", colour2: string=null) { return getCSSfromSVG(getIcon(name,colour,colour2)); }