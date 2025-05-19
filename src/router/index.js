import { createRouter, createWebHistory } from 'vue-router'
import index from '../components/index.vue'
import spheres from '../components/spheres.vue'
import earth from '../components/earth.vue'
import line from '../components/line.vue'

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
    },
    {
        path: '/earth',
        component: earth
    },
    {
        path: '/line',
        component: line
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
