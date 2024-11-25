// Mobile menu functionality
const menuBtn = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');

menuBtn.addEventListener('click', () => {
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
});

// Blog post data
let blogPosts = JSON.parse(localStorage.getItem('blogPosts')) || [];

// Search functionality
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchResults = document.getElementById('search-results');
let currentSearchTerm = '';

function searchPosts(term) {
    currentSearchTerm = term.toLowerCase();
    const results = blogPosts.filter(post => 
        post.title.toLowerCase().includes(currentSearchTerm) ||
        post.content.toLowerCase().includes(currentSearchTerm) ||
        post.tags.some(tag => tag.toLowerCase().includes(currentSearchTerm))
    );
    
    if (searchResults) {
        searchResults.textContent = currentSearchTerm 
            ? `Found ${results.length} post${results.length === 1 ? '' : 's'} matching "${term}"`
            : '';
    }
    
    displayBlogPosts(results);
}

if (searchInput && searchBtn) {
    searchBtn.addEventListener('click', () => searchPosts(searchInput.value));
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchPosts(searchInput.value);
        }
    });
}

// Sorting functionality
const sortSelect = document.getElementById('sort-posts');
if (sortSelect) {
    sortSelect.addEventListener('change', () => {
        const posts = currentSearchTerm ? 
            blogPosts.filter(post => 
                post.title.toLowerCase().includes(currentSearchTerm) ||
                post.content.toLowerCase().includes(currentSearchTerm)
            ) : blogPosts;
        displayBlogPosts(posts);
    });
}

// Tags filter
function updateTagsFilter() {
    const tagsFilter = document.getElementById('tags-filter');
    if (!tagsFilter) return;

    const allTags = new Set();
    blogPosts.forEach(post => post.tags.forEach(tag => allTags.add(tag)));

    tagsFilter.innerHTML = Array.from(allTags).map(tag => 
        `<span class="tag-filter" data-tag="${tag}">${tag}</span>`
    ).join('');

    document.querySelectorAll('.tag-filter').forEach(tagEl => {
        tagEl.addEventListener('click', () => {
            tagEl.classList.toggle('active');
            filterPosts();
        });
    });
}

function filterPosts() {
    const activeTags = Array.from(document.querySelectorAll('.tag-filter.active'))
        .map(tag => tag.dataset.tag);
    
    const filteredPosts = activeTags.length > 0
        ? blogPosts.filter(post => 
            post.tags.some(tag => activeTags.includes(tag))
        )
        : blogPosts;

    displayBlogPosts(filteredPosts);
}

// Function to create a blog post card
function createBlogPostCard(post) {
    const coverImage = post.image ? `<img src="${post.image}" alt="${post.title}" class="post-cover-image">` : '';
    return `
        <div class="blog-post-card" data-post-id="${post.id}">
            ${coverImage}
            <div class="post-actions-menu">
                <button class="post-action-btn edit" onclick="editPost(${post.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="post-action-btn delete" onclick="confirmDelete(${post.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <h2><a href="view-post.html?id=${post.id}">${post.title}</a></h2>
            <div class="post-meta">
                <span class="author">By ${post.author}</span>
                <span class="date">${new Date(post.date).toLocaleDateString()}</span>
            </div>
            <div class="post-content">${post.content.substring(0, 150)}...</div>
            <div class="post-tags">
                ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
    `;
}

// Function to display blog posts
function displayBlogPosts(postsToDisplay = blogPosts) {
    const postsContainer = document.querySelector('.posts-container');
    if (postsContainer) {
        if (postsToDisplay.length === 0) {
            postsContainer.innerHTML = '<p class="no-posts">No blog posts found.</p>';
            return;
        }

        const sortOrder = sortSelect ? sortSelect.value : 'newest';
        const sortedPosts = [...postsToDisplay].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        postsContainer.innerHTML = sortedPosts.map(post => createBlogPostCard(post)).join('');
    }
}

// Single post view
function displaySinglePost() {
    const container = document.querySelector('.single-post-container');
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const postId = parseInt(urlParams.get('id'));
    const post = blogPosts.find(p => p.id === postId);

    if (!post) {
        container.innerHTML = '<p class="no-posts">Post not found.</p>';
        return;
    }

    const coverImage = post.image 
        ? `<img src="${post.image}" alt="${post.title}" class="single-post-image">` 
        : '';

    container.innerHTML = `
        <article class="single-post">
            <div class="single-post-header">
                <h1>${post.title}</h1>
                <div class="single-post-meta">
                    <span class="author">By ${post.author}</span>
                    <span class="date">${new Date(post.date).toLocaleDateString()}</span>
                </div>
                <div class="post-tags">
                    ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
            ${coverImage}
            <div class="single-post-content">
                ${post.content}
            </div>
        </article>
    `;
}

// Initialize the page
function initializePage() {
    if (document.querySelector('.posts-container')) {
        displayBlogPosts();
        updateTagsFilter();
    } else if (document.querySelector('.single-post-container')) {
        displaySinglePost();
    }
}

initializePage();

// Initialize Quill editor if we're on the create/edit post page
let quill;
const editorContainer = document.getElementById('editor-container');
if (editorContainer) {
    quill = new Quill('#editor-container', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'color': [] }, { 'background': [] }],
                ['link', 'image'],
                ['clean']
            ]
        }
    });
}

// Image upload preview
const imageInput = document.getElementById('post-image');
const imagePreview = document.getElementById('image-preview');

if (imageInput) {
    imageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        }
    });
}

// Function to edit a post
function editPost(postId) {
    const post = blogPosts.find(p => p.id === postId);
    if (post) {
        localStorage.setItem('editingPost', JSON.stringify(post));
        window.location.href = 'create-post.html?edit=' + postId;
    }
}

// Function to confirm post deletion
function confirmDelete(postId) {
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    dialog.innerHTML = `
        <h3>Delete Post</h3>
        <p>Are you sure you want to delete this post?</p>
        <div class="confirm-dialog-actions">
            <button class="confirm-no" onclick="this.parentElement.parentElement.remove()">Cancel</button>
            <button class="confirm-yes" onclick="deletePost(${postId})">Delete</button>
        </div>
    `;
    document.body.appendChild(dialog);
    dialog.style.display = 'block';
}

// Function to delete a post
function deletePost(postId) {
    blogPosts = blogPosts.filter(post => post.id !== postId);
    localStorage.setItem('blogPosts', JSON.stringify(blogPosts));
    document.querySelector('.confirm-dialog').remove();
    displayBlogPosts();
}

// Preview functionality
const previewBtn = document.querySelector('.preview-btn');
const previewModal = document.getElementById('preview-modal');
const closeModal = document.querySelector('.close-modal');

if (previewBtn && previewModal) {
    previewBtn.addEventListener('click', () => {
        const title = document.getElementById('post-title').value;
        const author = document.getElementById('post-author').value;
        const content = quill.root.innerHTML;
        const tags = document.getElementById('post-tags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag !== '');
        
        const previewContent = `
            <h1>${title}</h1>
            <p class="preview-meta">By ${author}</p>
            <div class="preview-content">${content}</div>
            <div class="preview-tags">
                ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        `;
        
        document.getElementById('post-preview').innerHTML = previewContent;
        previewModal.style.display = 'block';
    });

    closeModal.addEventListener('click', () => {
        previewModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === previewModal) {
            previewModal.style.display = 'none';
        }
    });
}

// Handle blog post form submission
const blogPostForm = document.getElementById('blog-post-form');
if (blogPostForm) {
    // Check if we're editing a post
    const urlParams = new URLSearchParams(window.location.search);
    const editingPostId = urlParams.get('edit');
    
    if (editingPostId) {
        const editingPost = JSON.parse(localStorage.getItem('editingPost'));
        if (editingPost) {
            document.getElementById('post-title').value = editingPost.title;
            document.getElementById('post-author').value = editingPost.author;
            document.getElementById('post-tags').value = editingPost.tags.join(', ');
            quill.root.innerHTML = editingPost.content;
            if (editingPost.image) {
                imagePreview.innerHTML = `<img src="${editingPost.image}" alt="Preview">`;
            }
        }
    }

    blogPostForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const postData = {
            id: editingPostId ? parseInt(editingPostId) : Date.now(),
            title: document.getElementById('post-title').value,
            author: document.getElementById('post-author').value,
            content: quill.root.innerHTML,
            tags: document.getElementById('post-tags').value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag !== ''),
            date: new Date().toISOString()
        };

        // Handle image
        const imagePreviewImg = imagePreview.querySelector('img');
        if (imagePreviewImg) {
            postData.image = imagePreviewImg.src;
        }
        
        if (editingPostId) {
            const index = blogPosts.findIndex(p => p.id === parseInt(editingPostId));
            if (index !== -1) {
                blogPosts[index] = postData;
            }
            localStorage.removeItem('editingPost');
        } else {
            blogPosts.push(postData);
        }
        
        localStorage.setItem('blogPosts', JSON.stringify(blogPosts));
        alert(editingPostId ? 'Post updated successfully!' : 'Post published successfully!');
        window.location.href = 'index.html';
    });
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            // Close mobile menu if open
            if (window.innerWidth <= 768) {
                navLinks.style.display = 'none';
            }
        }
    });
});

// Contact form handling
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData);
        console.log('Form submitted with data:', data);
        alert('Thank you for your message! We will get back to you soon.');
        contactForm.reset();
    });
}

// Add dynamic styling to the navbar on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu toggle
    const menuBtn = document.querySelector('.menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Initialize search functionality
    initializeSearch();
    
    // Initialize post management
    initializePostManagement();
});
