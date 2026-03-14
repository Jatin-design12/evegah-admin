import Router from 'express';
import masterRoute from './master.routes';
import adminRoute from './admin.routes';
import userRoute from './user.routes';
import commanRoute from './comman.routes';
import inwardRoute from './inward.routes';
import paymentRoute from './payment.routes';
import bookingRoute from './ride.booking.routes';

import rideEarningsRoute from './ride.Earning.Report.routes';

const router = Router();
const defaultRoutes = [
    {
        path: '/',
        route: masterRoute
    },
    {
        path: '/',
        route: adminRoute
    },
    {
        path: '/',
        route: userRoute
    },
    {
        path: '/',
        route: commanRoute
    },
    {
        path: '/',
        route: inwardRoute
    },
    {
        path: '/',
        route: paymentRoute
    },
    {
        path: '/',
        route: bookingRoute
    },

    {
        path: '/',
        route: rideEarningsRoute
    }
];

defaultRoutes.forEach((route) => {
    router.use(route.path, route.route);
});

export default router;
