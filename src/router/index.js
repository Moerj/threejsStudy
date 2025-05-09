import { createRouter, createWebHistory } from 'vue-router'
import index from '../components/index.vue'
import spheres from '../components/spheres.vue'

const routes = [
    {
        path: '/',
        redirect: '/index'
    },
    {
        path: '/index',
        component: index
    },
    {
        path: '/spheres',
        component: spheres
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
