import { createRouter, createWebHistory } from 'vue-router'
import index from '../components/index.vue'
import spheres from '../components/spheres.vue'
import model from '../components/model.vue'

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
        path: '/model',
        component: model
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
