import { r as registerInstance, h, d as Host } from './index-BDyeD8t8.js';

const kritzelAvatarCss = () => `:host{display:inline-flex;justify-content:center;align-items:center;border-radius:50%;overflow:hidden;user-select:none;flex-shrink:0}.avatar-image{display:block;width:100%;height:100%;object-fit:cover;border-radius:50%}.avatar-initials{display:flex;justify-content:center;align-items:center;width:100%;height:100%;border-radius:50%;color:var(--kritzel-avatar-initials-color, #ffffff);font-weight:var(--kritzel-avatar-initials-font-weight, 500);font-family:var(--kritzel-avatar-initials-font-family, sans-serif);line-height:1}.avatar-default{display:flex;justify-content:center;align-items:center;width:100%;height:100%;border-radius:50%;background-color:var(--kritzel-avatar-default-background, #e0e0e0);color:var(--kritzel-avatar-default-color, #9e9e9e)}.avatar-default svg{width:60%;height:60%}:host(.has-image){border:var(--kritzel-avatar-border, none)}:host(.has-initials){border:var(--kritzel-avatar-border, none)}:host(.has-default){border:var(--kritzel-avatar-border, none)}`;

const KritzelAvatar = class {
    constructor(hostRef) {
        registerInstance(this, hostRef);
    }
    /** Full user object. If provided, individual props are ignored. */
    user;
    /** Direct prop: user's display name (used for initials fallback) */
    name;
    /** Avatar diameter in pixels */
    size = 32;
    /** Background color for initials fallback */
    color;
    /** Tracks whether the image failed to load */
    imageError = false;
    retryCount = 0;
    maxRetries = 3;
    retryTimer;
    userChanged() {
        this.resetImageState();
    }
    profileImageUrlChanged() {
        this.resetImageState();
    }
    resetImageState() {
        this.imageError = false;
        this.retryCount = 0;
        clearTimeout(this.retryTimer);
    }
    disconnectedCallback() {
        clearTimeout(this.retryTimer);
    }
    getImageUrl() {
        return this.user?.profileImageUrl;
    }
    getDisplayName() {
        if (this.user) {
            return (this.user.displayName ??
                ([this.user.firstName, this.user.lastName].filter(Boolean).join(' ') ||
                    this.user.email));
        }
        return this.name;
    }
    getInitials() {
        const displayName = this.getDisplayName();
        if (!displayName)
            return undefined;
        const parts = displayName.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return parts[0][0]?.toUpperCase();
    }
    getBackgroundColor() {
        return this.user?.color ?? this.color ?? this.generateColorFromName();
    }
    generateColorFromName() {
        const name = this.getDisplayName() || '';
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash % 360);
        return `hsl(${hue}, 45%, 55%)`;
    }
    handleImageError = () => {
        if (this.retryCount < this.maxRetries) {
            this.retryCount++;
            const delay = 1000 * Math.pow(2, this.retryCount - 1);
            this.retryTimer = setTimeout(() => {
                this.imageError = false;
            }, delay);
        }
        this.imageError = true;
    };
    render() {
        const imageUrl = this.getImageUrl();
        const initials = this.getInitials();
        const showImage = imageUrl && !this.imageError;
        const showInitials = !showImage && initials;
        const showDefaultIcon = !showImage && !showInitials;
        const containerStyles = {
            width: `${this.size}px`,
            height: `${this.size}px`,
            fontSize: `${Math.round(this.size * 0.4)}px`,
        };
        return (h(Host, { key: 'ceb67b8110efb4a4d5727c6fdcce4bd64f333be3', style: containerStyles, class: {
                'has-image': !!showImage,
                'has-initials': !!showInitials,
                'has-default': !!showDefaultIcon,
            }, role: "img", "aria-label": this.getDisplayName() || 'User avatar' }, showImage && (h("img", { key: 'aeb37def9c124f3e03ee30fbfe30c47a79c76e18', src: imageUrl, alt: "", class: "avatar-image", ref: (el) => {
                if (el) {
                    el.referrerPolicy = 'no-referrer';
                    el.crossOrigin = 'anonymous';
                }
            }, onError: this.handleImageError })), showInitials && (h("span", { key: '536eb291d7e029d5db419d0360e0ef307cea5edf', class: "avatar-initials", style: { backgroundColor: this.getBackgroundColor() } }, initials)), showDefaultIcon && (h("span", { key: '71dc33191e8da37cd02cbd60832d52be9dcb8146', class: "avatar-default" }, h("svg", { key: '9ddcf26c9a77579d3924324e736e14f7ae02bff2', viewBox: "0 0 24 24", fill: "currentColor" }, h("path", { key: 'df408a91dcc03e2172bb7b9877772efa9dea8575', d: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" }))))));
    }
    static get watchers() { return {
        "user": [{
                "userChanged": 0
            }],
        "profileImageUrl": [{
                "profileImageUrlChanged": 0
            }]
    }; }
};
KritzelAvatar.style = kritzelAvatarCss();

export { KritzelAvatar as kritzel_avatar };
//# sourceMappingURL=kritzel-avatar.entry.esm.js.map

//# sourceMappingURL=kritzel-avatar.entry.js.map